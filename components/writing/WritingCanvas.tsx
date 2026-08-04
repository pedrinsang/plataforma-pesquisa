"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, type Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import {
  DEFAULT_MARGINS,
  PAGE_GAP_PX,
  PAGE_HEIGHT_PX,
  PAGE_STRIDE_PX,
  PAGE_WIDTH_PX,
  pageContentBottom,
  pageGeometry,
  pageOfFlowY,
  sheetTop,
  stackHeight,
  type PageGeometry,
  type PageMargins,
} from "@/lib/writing/page-metrics";
import {
  paginationKey,
  sameSpacers,
  SPACER_SELECTOR,
  type PageSpacer,
} from "@/lib/writing/extensions/pagination";

/** Tolerância de medição (subpixel) antes de considerar que um bloco transbordou. */
const EPS = 0.5;

/**
 * Mínimo de linhas de um mesmo parágrafo que ficam juntas de cada lado da
 * virada — controle de viúvas e órfãs, como num processador de texto. Quando não
 * dá para respeitar dos dois lados, o parágrafo inteiro desce.
 */
const MIN_LINES = 2;

/**
 * Blocos que podem ser repartidos entre duas folhas. Título não parte (fica com
 * o texto que ele abre), e tabela/imagem/quebra/gráfico não têm linhas de texto
 * para repartir — esses continuam descendo inteiros.
 *
 * A bibliografia entra aqui pelo mesmo motivo das listas: por fora é um nó só
 * (para o botão da faixa poder reescrevê-la no lugar), mas por dentro são
 * parágrafos comuns, e uma lista de referências passa de uma folha com
 * facilidade — sem repartir, ela atravessaria a virada.
 */
const SPLITTABLE = new Set([
  "paragraph",
  "bulletList",
  "orderedList",
  "blockquote",
  "bibliography",
]);

/**
 * Blocos que só partem quando não cabem numa folha inteira. Um título fica com o
 * texto que ele abre (por isso não parte à toa), mas um título absurdamente
 * longo precisa partir — a alternativa é atravessar a virada por cima do vão.
 */
const SPLITTABLE_IF_TALL = new Set(["heading", "codeBlock"]);

/**
 * "Manter com o próximo": blocos que não ficam sozinhos no pé da folha. Um
 * título anuncia o que vem depois — deixá-lo na folha de cima com o texto (ou a
 * lista) na de baixo é o defeito clássico de quem pagina só por altura.
 */
const KEEP_WITH_NEXT = new Set(["heading"]);

/**
 * Quantas passadas de medição uma mesma geometria pode consumir antes de a
 * paginação parar de reescrever o desenho. É uma trava de segurança: a medição
 * deve convergir na segunda passada, e a única forma de gastar isto é um
 * conteúdo em que ela não converge. Melhor congelar num desenho do que piscar.
 */
const MAX_PASSES = 8;

/** Um espaçador de paginação — de bloco ou de linha — no DOM do editor. */
function isSpacer(el: Element): boolean {
  return (
    el.classList.contains("folium-page-spacer") || el.classList.contains("folium-line-spacer")
  );
}

/** Assinatura de um plano, para reconhecer que a medição entrou em ciclo. */
function signature(spacers: PageSpacer[]): string {
  return spacers.map((s) => `${s.pos}:${s.inline ? "i" : "b"}:${Math.round(s.height)}`).join("|");
}

/**
 * Uma linha visual de um bloco, em coordenadas naturais do fluxo.
 *
 * A linha guarda **onde procurar** a posição no documento, não a posição em si:
 * `posAtCoords` custa cerca de 1 ms por chamada e um documento de 45 páginas tem
 * mais de mil linhas — resolver todas a cada medição travava a digitação por
 * segundos. Pontos de virada são um por folha, então a posição é resolvida só
 * quando a linha vira quebra de verdade (`resolveAnchor`).
 */
type Line = {
  top: number;
  bottom: number;
  /**
   * Elemento do parágrafo (textblock) a que a linha pertence. É a unidade de
   * viúva e órfã: num bloco de vários parágrafos (lista, citação) cada item
   * conta separado, como num processador de texto. Vem do DOM porque comparar
   * identidade de elemento é de graça.
   */
  block: Element | null;
  /** A linha abre o parágrafo dela. */
  opens: boolean;
  /** Parágrafo imediatamente anterior, dentro do mesmo bloco. */
  prevBlock: Element | null;
  /** Ponto na tela por onde achar a posição no doc, se for preciso. */
  hit: { left: number; top: number };
};

type Entry = {
  pos: number;
  /** Fim do nó no doc — delimita as posições válidas dentro dele. */
  end: number;
  /** Nome do tipo do nó — quem decide "manter com o próximo". */
  type: string;
  isBreak: boolean;
  naturalTop: number;
  height: number;
  /** Linhas do bloco; `null` quando ele não pode ser repartido. */
  lines: Line[] | null;
};

/**
 * Lê a geometria real do documento e devolve os blocos de primeiro nível com a
 * posição no doc, a altura e o topo "natural" (descontando os espaçadores já
 * aplicados). O pareamento é por índice: cada nó de primeiro nível corresponde a
 * um filho do DOM do ProseMirror, na mesma ordem.
 */
function readEntries(editor: Editor, zoom: number, contentHeight: number): Entry[] | null {
  const root = editor.view.dom as HTMLElement;
  const positions: number[] = [];
  const ends: number[] = [];
  const types: string[] = [];
  let pos = 0;
  editor.state.doc.forEach((node) => {
    positions.push(pos);
    pos += node.nodeSize;
    ends.push(pos);
    types.push(node.type.name);
  });

  const entries: Entry[] = [];
  let spacerAcc = 0;
  let index = 0;
  for (const child of Array.from(root.children) as HTMLElement[]) {
    // Qualquer espaçador nosso, dos dois tipos: logo depois de uma edição o
    // remapeamento pode deixar um vão de linha num lugar em que ele vira filho
    // direto do editor. Se ele não for descontado aqui, todo bloco abaixo é
    // medido baixo demais e o plano seguinte reserva vãos que não chegam à
    // folha de baixo — a origem da última página piscando.
    if (isSpacer(child)) {
      spacerAcc += child.offsetHeight;
      continue;
    }
    // O gapcursor é um enfeite do ProseMirror, não um nó do documento — pular,
    // senão o pareamento por índice sai do lugar enquanto ele está visível.
    if (child.classList.contains("ProseMirror-gapcursor")) continue;
    if (index >= positions.length) return null; // DOM e doc dessincronizados
    // Os espaçadores de linha ficam *dentro* do bloco: saem da altura natural
    // dele e entram no acumulado só depois, para não deslocar o próprio bloco.
    const inner = innerSpacerHeight(child);
    const naturalTop = child.offsetTop - spacerAcc;
    const height = child.offsetHeight - inner;
    const type = types[index];
    const canSplit =
      SPLITTABLE.has(type) ||
      (SPLITTABLE_IF_TALL.has(type) && height > contentHeight + EPS);
    entries.push({
      pos: positions[index],
      end: ends[index],
      type,
      isBreak: type === "pageBreak",
      naturalTop,
      height,
      lines: canSplit ? readLines(child, naturalTop, zoom) : null,
    });
    spacerAcc += inner;
    index += 1;
  }
  return index === positions.length ? entries : null;
}

/** Soma dos espaçadores de virada que já estão dentro deste bloco. */
function innerSpacerHeight(block: HTMLElement): number {
  let total = 0;
  block.querySelectorAll<HTMLElement>(SPACER_SELECTOR).forEach((el) => {
    total += el.offsetHeight;
  });
  return total;
}

/**
 * Retângulos das caixas de linha de um bloco, em coordenadas de tela.
 *
 * A varredura é pelos **nós de texto**, e não por um `Range` sobre o bloco
 * inteiro: um Range que atravessa elementos devolve, junto com as linhas, o
 * retângulo de cada bloco de dentro (o `<li>` da lista, o `<p>` da citação).
 * Como as faixas são agrupadas pelo ponto médio, esse retângulo engolia todas as
 * linhas do item numa faixa só — a lista virava uma fila de "linhas" do tamanho
 * de um item inteiro e nunca partia por dentro. Range sobre nó de texto só
 * devolve caixa de linha, nunca caixa de elemento.
 */
function textLineRects(block: HTMLElement): Array<{ rect: DOMRect; owner: Element | null }> {
  const walker = document.createTreeWalker(
    block,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );
  const range = document.createRange();
  const out: Array<{ rect: DOMRect; owner: Element | null }> = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Dos elementos, só a quebra manual: sem texto nenhum, ela ainda ocupa
      // uma linha da folha.
      const el = node as Element;
      if (el.tagName !== "BR") continue;
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) out.push({ rect, owner: el.closest(TEXTBLOCK_SELECTOR) });
      continue;
    }
    if ((node as Text).data === "") continue;
    const owner = node.parentElement?.closest(TEXTBLOCK_SELECTOR) ?? null;
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      if (rect.height > 0) out.push({ rect, owner });
    }
  }
  return out;
}

/**
 * Os elementos que o ProseMirror desenha para um textblock. Serve para saber, a
 * partir de um nó de texto, a que parágrafo a linha pertence — sem consultar o
 * documento, que é a parte cara da medição.
 */
const TEXTBLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, pre, td, th, li, blockquote";

/** Posição do textblock que contém `pos` (a posição *antes* dele), ou -1. */
function textblockStart(doc: PMNode, pos: number): number {
  const $pos = doc.resolve(pos);
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    if ($pos.node(depth).isTextblock) return $pos.before(depth);
  }
  return -1;
}

/** Última posição de texto dentro do textblock que começa em `start`, ou -1. */
function textblockEnd(doc: PMNode, start: number): number {
  const node = doc.nodeAt(start);
  return node ? start + 1 + node.content.size : -1;
}

/**
 * Mede as linhas visuais de um bloco: um retângulo por caixa de linha (vários
 * por linha quando há marcas), agrupados em faixas.
 *
 * Estes retângulos vêm em coordenadas de tela, **com o zoom aplicado** — por
 * isso todo delta é dividido por `zoom` antes de virar coordenada natural. As
 * faixas que correspondem a um espaçador já aplicado são descontadas, do mesmo
 * jeito que os espaçadores de bloco.
 *
 * Cada linha sai sabendo a que parágrafo pertence (o textblock: o item da lista,
 * o parágrafo da citação) e por onde achar a posição dela no documento, se ela
 * vier a ser o ponto de virada — ver `Line` e `resolveAnchor`.
 */
function readLines(block: HTMLElement, naturalTop: number, zoom: number): Line[] | null {
  const rects = textLineRects(block);
  if (rects.length === 0) return null;

  const blockTop = block.getBoundingClientRect().top;
  const spacerRects = Array.from(block.querySelectorAll<HTMLElement>(SPACER_SELECTOR))
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.height > 0);

  /** O retângulo cai na faixa de um espaçador já aplicado (não é texto). */
  const insideSpacer = (top: number, bottom: number) => {
    const middle = (top + bottom) / 2;
    return spacerRects.some((s) => middle > s.top - 0.5 && middle < s.bottom + 0.5);
  };

  /**
   * Vão já aplicado acima desta coordenada de tela, em px naturais. Substituir
   * a antiga busca por retângulo idêntico é o que torna a medição estável: o
   * navegador pode devolver a caixa do espaçador com altura de linha em vez da
   * altura pedida (e o ProseMirror ainda insere separadores invisíveis ao lado
   * de um widget), e qualquer diferença de meio pixel fazia o vão ser lido como
   * uma linha de texto — daí em diante o plano inteiro saía deslocado.
   */
  const spacerAbove = (top: number) =>
    spacerRects.reduce((sum, s) => (s.top < top - 0.5 ? sum + s.height : sum), 0) / zoom;

  // Um retângulo entra na faixa corrente quando o **meio** dele cai dentro dela.
  // Testar só a sobreposição não serve: com entrelinha apertada (os títulos em
  // Cormorant, por exemplo) as caixas de linhas vizinhas se sobrepõem, e o bloco
  // inteiro viraria uma faixa só — nenhum ponto de virada, nenhuma quebra.
  // Pelo meio, sobrescrito e corpo continuam na mesma linha e linhas vizinhas
  // continuam separadas.
  const bands: Array<{ top: number; bottom: number; left: number; owner: Element | null }> =
    [];
  for (const { rect: r, owner } of rects) {
    if (insideSpacer(r.top, r.bottom)) continue;
    const last = bands[bands.length - 1];
    const middle = r.top + r.height / 2;
    if (last && middle > last.top && middle < last.bottom) {
      last.top = Math.min(last.top, r.top);
      last.bottom = Math.max(last.bottom, r.bottom);
      last.left = Math.min(last.left, r.left);
    } else {
      bands.push({ top: r.top, bottom: r.bottom, left: r.left, owner });
    }
  }

  const lines: Line[] = [];
  let prevBlock: Element | null = null;
  for (const band of bands) {
    const height = band.bottom - band.top;
    const top = naturalTop + (band.top - blockTop) / zoom - spacerAbove(band.top);
    const opens = band.owner !== null && band.owner !== prevBlock;
    lines.push({
      top,
      bottom: top + height / zoom,
      block: band.owner,
      opens,
      prevBlock: opens ? prevBlock : null,
      hit: { left: band.left + 1, top: band.top + height / 2 },
    });
    if (band.owner) prevBlock = band.owner;
  }
  return lines.length > 0 ? lines : null;
}

/**
 * Posição no doc onde pendurar o vão que empurra `line` para a folha de baixo,
 * ou -1 quando não há ponto utilizável.
 *
 * Na primeira linha de um parágrafo interno (o item da lista, o parágrafo da
 * citação) o vão vai para o **fim do parágrafo anterior**. Um vão no começo do
 * item deixaria o marcador — o "•", o número — na folha de cima e o texto na de
 * baixo, que era o que estragava a quebra de uma lista.
 */
function resolveAnchor(editor: Editor, entry: Entry, line: Line): number {
  const inside = (pos: number) => pos > entry.pos && pos < entry.end;

  if (line.opens && line.prevBlock) {
    const doc = editor.state.doc;
    let at = -1;
    try {
      at = editor.view.posAtDOM(line.prevBlock, 0);
    } catch {
      at = -1;
    }
    const start = at >= 0 ? textblockStart(doc, at) : -1;
    const end = start >= 0 ? textblockEnd(doc, start) : -1;
    if (end >= 0 && inside(end)) return end;
  }

  const hit = editor.view.posAtCoords(line.hit);
  return hit && inside(hit.pos) ? hit.pos : -1;
}

/**
 * Simula o fluxo do texto sobre a pilha de folhas: percorre os blocos na ordem e,
 * quando um deles atravessaria o fim da área de texto da folha, reserva o vão que
 * falta para ele começar no topo da folha seguinte. Uma quebra de página explícita
 * força esse salto no bloco seguinte.
 *
 * Blocos mais altos que uma folha (tabela/imagem grande) não são empurrados — não
 * há para onde —, então seguem atravessando, como num processador de texto.
 */
function planPages(
  editor: Editor,
  entries: Entry[],
  contentHeight: number,
): { spacers: PageSpacer[]; pageCount: number } {
  const spacers: PageSpacer[] = [];
  // Vão total já reservado acima do ponto que está sendo examinado. A posição
  // real de qualquer coisa é sempre `natural + offset`, então não é preciso
  // caminhar de bloco em bloco somando alturas.
  let offset = 0;
  let bottom = 0;
  let forceNextPage = false;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    let top = entry.naturalTop + offset;
    const fitsInOnePage = entry.height <= contentHeight + EPS;
    const overflows = (at: number) =>
      at + entry.height > pageContentBottom(pageOfFlowY(at), contentHeight) + EPS;

    if (forceNextPage) {
      const push = sheetTop(pageOfFlowY(top) + 1) - top;
      if (push > EPS) {
        spacers.push({ pos: entry.pos, height: push });
        offset += push;
        top += push;
      }
      forceNextPage = false;
    }

    if (overflows(top)) {
      if (entry.lines && entry.lines.length > 1) {
        offset += splitEntry(editor, entry, offset, spacers, contentHeight);
      } else if (fitsInOnePage) {
        const push = sheetTop(pageOfFlowY(top) + 1) - top;
        if (push > EPS) {
          spacers.push({ pos: entry.pos, height: push });
          offset += push;
        }
      }
      // Bloco mais alto que uma folha e sem linhas para repartir (tabela ou
      // imagem grande) segue atravessando: não há para onde empurrar.
      top = entry.naturalTop + offset;
    }

    if (KEEP_WITH_NEXT.has(entry.type)) {
      const push = keepWithNextPush(entries, index, top, offset, contentHeight);
      if (push > EPS) {
        spacers.push({ pos: entry.pos, height: push });
        offset += push;
      }
    }

    bottom = Math.max(bottom, entry.naturalTop + offset + entry.height);
    if (entry.isBreak) forceNextPage = true;
  }

  const lastPage = pageOfFlowY(Math.max(bottom - EPS, 0));
  return { spacers, pageCount: Math.max(1, lastPage + 1) + (forceNextPage ? 1 : 0) };
}

/**
 * Até onde um bloco precisa caber para **começar** numa folha, e não ser
 * inteiramente empurrado para a de baixo. Não basta a primeira linha: pelas
 * regras de viúva e órfã, um parágrafo curto demais para partir desce inteiro,
 * então o requisito é o mesmo que o `splitEntry` aplica — `MIN_LINES` do
 * primeiro parágrafo, ou ele todo quando é curto demais para ser repartido.
 */
function firstUnitBottom(entry: Entry): number {
  const lines = entry.lines;
  if (!lines || lines.length === 0) return entry.naturalTop + entry.height;
  const [, end] = paraSpan(lines, 0);
  const needed = end >= MIN_LINES * 2 ? MIN_LINES : end;
  return lines[Math.min(needed, lines.length) - 1].bottom;
}

/**
 * Vão que um bloco "manter com o próximo" precisa para não terminar a folha
 * sozinho: se a primeira linha do que vem depois dele não cabe na mesma folha,
 * ele desce junto. Títulos seguidos contam como um bloco só — o teste roda no
 * primeiro deles, e depois do salto os de baixo já cabem.
 *
 * Devolve 0 quando não há nada a fazer, inclusive quando o bloco já está no alto
 * da folha: aí descer não resolveria nada e ainda queimaria uma página inteira.
 */
function keepWithNextPush(
  entries: Entry[],
  index: number,
  top: number,
  offset: number,
  contentHeight: number,
): number {
  const page = pageOfFlowY(top);
  if (top <= sheetTop(page) + EPS) return 0;

  let next = index + 1;
  while (next < entries.length && KEEP_WITH_NEXT.has(entries[next].type)) next += 1;
  const after = entries[next];
  if (!after || after.isBreak) return 0;

  const need = firstUnitBottom(after);
  if (need - after.naturalTop > contentHeight) return 0;
  if (need + offset <= pageContentBottom(page, contentHeight) + EPS) return 0;
  return sheetTop(page + 1) - top;
}

/**
 * Faixa de linhas do parágrafo a que a linha `i` pertence. É a unidade de viúva
 * e órfã: num bloco de vários parágrafos (a lista, a citação) cada item conta
 * por si. Sem identidade de parágrafo, o bloco inteiro é o parágrafo.
 */
function paraSpan(lines: Line[], i: number): [number, number] {
  const id = lines[i].block;
  if (!id) return [0, lines.length];
  let start = i;
  let end = i + 1;
  while (start > 0 && lines[start - 1].block === id) start -= 1;
  while (end < lines.length && lines[end].block === id) end += 1;
  return [start, end];
}

/**
 * Reparte um bloco entre folhas. Percorre as linhas e, na primeira que cruzaria
 * o fim da área de texto, reserva o vão que falta para ela recomeçar no topo da
 * folha seguinte — o parágrafo continua sendo um só nó do documento, o vão é
 * apenas um espaçador em linha desenhado no meio dele.
 *
 * Viúvas e órfãs são contadas **por parágrafo**: numa lista, o item que não
 * consegue deixar `MIN_LINES` dos dois lados desce inteiro para a folha de
 * baixo, em vez de partir na primeira linha. Devolve o vão somado.
 */
function splitEntry(
  editor: Editor,
  entry: Entry,
  offsetIn: number,
  spacers: PageSpacer[],
  contentHeight: number,
): number {
  const lines = entry.lines;
  if (!lines) return 0;

  let offset = offsetIn;
  let pageStart = 0; // primeira linha da folha corrente
  let i = 0;
  // O laço só avança ou reserva vão, mas a medição é subpixel — a trava evita
  // que um arredondamento infeliz prenda a paginação num laço infinito.
  let guard = lines.length * 4 + 8;

  /** Desce o bloco inteiro; devolve `false` quando não há para onde. */
  const pushWholeBlock = () => {
    const blockTop = entry.naturalTop + offset;
    const push = sheetTop(pageOfFlowY(blockTop) + 1) - blockTop;
    if (push <= EPS) return false;
    spacers.push({ pos: entry.pos, height: push });
    offset += push;
    i = 0;
    pageStart = 0;
    return true;
  };

  while (i < lines.length && guard > 0) {
    guard -= 1;
    const line = lines[i];
    if (
      line.bottom + offset <=
      pageContentBottom(pageOfFlowY(line.top + offset), contentHeight) + EPS
    ) {
      i += 1;
      continue;
    }

    // Viúva e órfã: se a virada não deixa MIN_LINES dos dois lados, o parágrafo
    // inteiro desce (é o que o Word faz com um item curto no pé da folha).
    const [paraStart, paraEnd] = paraSpan(lines, i);
    let at = i - paraStart < MIN_LINES || paraEnd - i < MIN_LINES ? paraStart : i;

    // O bloco todo desce só quando a virada é a primeira linha dele e ele ainda
    // não foi repartido — depois disso não há mais como subir.
    if (at === 0 && pageStart === 0) {
      if (pushWholeBlock()) continue;
      break;
    }
    // Um parágrafo mais alto que a folha começa nela e mesmo assim não cabe:
    // parte onde deu, sem tentar subir.
    if (at <= pageStart) at = i;
    if (at <= pageStart) {
      i += 1;
      continue;
    }

    // Onde pendurar o vão — só aqui a posição no doc é resolvida, porque é a
    // parte cara da medição e isto acontece uma vez por folha.
    let anchor = resolveAnchor(editor, entry, lines[at]);
    if (anchor < 0 && at !== i) {
      at = i;
      anchor = resolveAnchor(editor, entry, lines[at]);
    }
    if (anchor < 0) {
      if (pageStart === 0 && pushWholeBlock()) continue;
      i += 1;
      continue;
    }

    const lineTop = lines[at].top + offset;
    const push = sheetTop(pageOfFlowY(lineTop) + 1) - lineTop;
    if (push <= EPS) {
      i += 1;
      continue;
    }
    spacers.push({ pos: anchor, height: push, inline: true });
    offset += push;
    pageStart = at;
    i = at + 1;
  }
  return offset - offsetIn;
}

/** Enfeites de edição que não existem no papel (cursor, alças, realces). */
const EDITING_ONLY = ".ProseMirror-gapcursor, .column-resize-handle, .ProseMirror-separator";
const EDITING_CLASSES = [
  "ProseMirror-selectednode",
  "ProseMirror-focused",
  "folium-search-match",
  "folium-search-current",
  "selectedCell",
];

/**
 * Copia a pilha de folhas para a impressão: mesma geometria, sem nada de editor.
 * O clone é só leitura — sai `contenteditable`, saem cursor/alças/realces —, mas
 * as alturas (inclusive os espaçadores de paginação) ficam intactas: é isso que
 * garante que o papel saia igual à tela.
 */
function printableStack(stack: HTMLElement): HTMLElement {
  const clone = stack.cloneNode(true) as HTMLElement;
  clone.setAttribute("aria-hidden", "true");
  clone.querySelectorAll(EDITING_ONLY).forEach((el) => el.remove());
  clone.querySelectorAll<HTMLElement>("[contenteditable]").forEach((el) => {
    el.removeAttribute("contenteditable");
    el.removeAttribute("tabindex");
  });
  clone.querySelectorAll<HTMLElement>(`.${EDITING_CLASSES.join(", .")}`).forEach((el) => {
    el.classList.remove(...EDITING_CLASSES);
  });
  return clone;
}

/**
 * Superfície de escrita: uma pilha de folhas A4 brancas (sempre claras, mesmo
 * dentro do chrome escuro — exceção intencional do design) com margens reais,
 * sombra por folha e vão visível entre elas. O texto é um fluxo contínuo por
 * cima da pilha; a extensão `foliumPagination` recebe daqui os espaçadores que
 * impedem um parágrafo de ser cortado na virada da página.
 *
 * Este elemento é o container de rolagem do editor em tela cheia.
 */
export function WritingCanvas({
  editor,
  zoom,
  header = "",
  footer = "",
  margins = DEFAULT_MARGINS,
  onPageCountChange,
  onCurrentPageChange,
  onViewport,
}: {
  editor: Editor | null;
  zoom: number;
  header?: string;
  footer?: string;
  /**
   * Margens da folha, em cm. Mudar isto muda a área de texto e, com ela, toda a
   * paginação — a geometria abaixo é a fonte única para a medição e para o
   * desenho, para que o papel nunca discorde da tela.
   */
  margins?: PageMargins;
  onPageCountChange?: (count: number) => void;
  onCurrentPageChange?: (page: number) => void;
  /** Rolagem horizontal e largura da barra de rolagem, para alinhar a régua. */
  onViewport?: (v: { scrollLeft: number; gutter: number }) => void;
}) {
  // Memoizado pelos quatro **números**, não pelo objeto: `paginate` depende da
  // geometria, e um objeto novo a cada render remontaria o agendamento da
  // paginação sem parar — exatamente o laço que a trava de assinatura existe
  // para evitar. Assim um pai que passe `margins` inline também fica seguro.
  const { top: mt, right: mr, bottom: mb, left: ml } = margins;
  const geo = useMemo(
    () => pageGeometry({ top: mt, right: mr, bottom: mb, left: ml }),
    [mt, mr, mb, ml],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const sizerRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  // Planos já tentados desde a última mudança real de conteúdo/zoom/fonte.
  const historyRef = useRef<string[]>([]);
  const viewportRef = useRef({ scrollLeft: -1, gutter: -1 });
  const [pageCount, setPageCount] = useState(1);
  // O total de páginas é lido dentro de listeners; num ref ele não precisa
  // remontar o observador de rolagem a cada nova paginação.
  const pageCountRef = useRef(1);

  // ── paginação: mede, planeja e aplica os espaçadores ─────────────────────
  const paginate = useCallback(() => {
    if (!editor || editor.isDestroyed) return;
    const entries = readEntries(editor, zoom, geo.contentHeight);
    if (!entries) return;
    const { spacers, pageCount: next } = planPages(editor, entries, geo.contentHeight);

    // O que vale é o que o plugin tem aplicado, não uma cópia nossa: numa
    // edição ele remapeia os espaçadores por conta própria, e comparar com uma
    // cópia desatualizada deixaria o desenho preso num estado que ninguém mais
    // recalcula.
    const applied = paginationKey.getState(editor.state) ?? [];
    if (sameSpacers(applied, spacers)) {
      historyRef.current = [];
      pageCountRef.current = next;
      setPageCount((prev) => (prev === next ? prev : next));
      return;
    }

    // Se este plano já foi tentado desde a última mudança de conteúdo, a
    // medição está em ciclo (aplicar A leva a medir B, e B de volta a A). Ficar
    // no desenho atual é o único desfecho estável — sem isto o editor alterna
    // entre dois desenhos para sempre, o que é a "página piscando" e também o
    // aviso de "Maximum update depth" (cada volta é um setState novo).
    const sig = signature(spacers);
    if (historyRef.current.includes(sig) || historyRef.current.length >= MAX_PASSES) return;
    historyRef.current.push(sig);

    pageCountRef.current = next;
    setPageCount((prev) => (prev === next ? prev : next));
    editor.commands.setPageSpacers(spacers);
  }, [editor, zoom, geo]);

  // Agenda com timer (e não `requestAnimationFrame`): rAF não roda em aba de
  // segundo plano, e a paginação precisa ficar correta mesmo quando o documento
  // carrega com a aba oculta.
  const schedulePaginate = useCallback(() => {
    if (timerRef.current !== null) return;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      paginate();
    }, 0);
  }, [paginate]);

  useEffect(() => {
    if (!editor) return;
    const flow = flowRef.current;
    // Conteúdo novo (ou zoom/fonte novos) é geometria nova: o orçamento de
    // passadas recomeça. O ResizeObserver, não — as passadas que ele dispara
    // são as nossas próprias, e é justamente delas que sai o ciclo.
    const fresh = () => {
      historyRef.current = [];
      schedulePaginate();
    };
    fresh();
    editor.on("update", fresh);
    // Fontes carregando, imagens chegando e a própria mudança de altura do fluxo
    // mexem na paginação; o ResizeObserver cobre todos esses casos.
    const ro = new ResizeObserver(schedulePaginate);
    if (flow) ro.observe(flow);
    document.fonts?.addEventListener?.("loadingdone", fresh);
    return () => {
      editor.off("update", fresh);
      ro.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", fresh);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [editor, schedulePaginate]);

  useEffect(() => {
    onPageCountChange?.(pageCount);
  }, [pageCount, onPageCountChange]);

  // Página "atual" = a que está no topo da área visível; também reporta a
  // rolagem horizontal e a barra de rolagem, para a régua (que fica fora deste
  // container) ficar exatamente sobre a folha.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = () => {
      const scrollLeft = el.scrollLeft;
      const gutter = el.offsetWidth - el.clientWidth;
      // Só avisa quando muda de verdade: um objeto novo a cada medição é um
      // `setState` novo a cada medição, e a régua não tem o que redesenhar.
      const last = viewportRef.current;
      if (last.scrollLeft !== scrollLeft || last.gutter !== gutter) {
        viewportRef.current = { scrollLeft, gutter };
        onViewport?.({ scrollLeft, gutter });
      }
      const page = Math.floor(el.scrollTop / (PAGE_STRIDE_PX * zoom)) + 1;
      onCurrentPageChange?.(Math.min(Math.max(page, 1), pageCountRef.current));
    };
    handle();
    el.addEventListener("scroll", handle, { passive: true });
    // Observa também a pilha: é a altura dela que faz a barra de rolagem
    // aparecer/sumir, e é essa largura que a régua precisa descontar.
    const ro = new ResizeObserver(handle);
    ro.observe(el);
    if (sizerRef.current) ro.observe(sizerRef.current);
    return () => {
      el.removeEventListener("scroll", handle);
      ro.disconnect();
    };
  }, [zoom, onCurrentPageChange, onViewport]);

  // ── via de impressão ─────────────────────────────────────────────────────
  // Imprimir/Baixar PDF não sai "print da tela" nem depende da paginação do
  // motor de impressão: no `beforeprint` montamos uma folha A4 por página, e
  // cada folha é uma **janela recortada** sobre um clone da pilha, deslocado
  // pelo topo daquela folha. O papel recebe, por construção, a mesma geometria
  // que está na tela — mesmas quebras, mesmo cabeçalho, rodapé e numeração.
  useEffect(() => {
    const build = () => {
      const root = printRef.current;
      const stack = stackRef.current;
      if (!root || !stack) return;
      const fragment = document.createDocumentFragment();
      const stackH = stackHeight(pageCount);
      for (let i = 0; i < pageCount; i += 1) {
        const page = document.createElement("div");
        page.className = "folium-print-page";
        const win = document.createElement("div");
        win.className = "folium-print-window";
        win.style.top = `${-sheetTop(i)}px`;
        win.style.width = `${PAGE_WIDTH_PX}px`;
        win.style.height = `${stackH}px`;
        win.appendChild(printableStack(stack));
        page.appendChild(win);
        fragment.appendChild(page);
      }
      root.replaceChildren(fragment);
    };
    // Os clones só existem durante a impressão — depois o DOM volta ao normal.
    const clear = () => printRef.current?.replaceChildren();

    window.addEventListener("beforeprint", build);
    window.addEventListener("afterprint", clear);
    return () => {
      window.removeEventListener("beforeprint", build);
      window.removeEventListener("afterprint", clear);
      clear();
    };
  }, [pageCount]);

  const stackH = stackHeight(pageCount);

  // Clicar no papel fora do texto foca o fim do documento (estilo Word).
  function focusEnd(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (!editor || flowRef.current?.contains(target)) return;
    editor.chain().focus("end").run();
  }

  return (
    <div className="folium-canvas" ref={containerRef}>
      {/* Reserva o espaço já escalado, para os scrollbars ficarem corretos. */}
      <div
        ref={sizerRef}
        className="folium-zoom-sizer"
        style={{ width: PAGE_WIDTH_PX * zoom, height: stackH * zoom }}
      >
        <div
          className="folium-zoom"
          style={{
            width: PAGE_WIDTH_PX,
            height: stackH,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <div
            ref={stackRef}
            className="folium-stack paper-light"
            onMouseDown={focusEnd}
            style={{ width: PAGE_WIDTH_PX, height: stackH }}
          >
            {/* As folhas — uma caixa branca por página, com sombra própria */}
            {Array.from({ length: pageCount }, (_, i) => (
              <div
                key={`sheet-${i}`}
                className="folium-sheet"
                style={{ top: sheetTop(i), height: PAGE_HEIGHT_PX }}
                aria-hidden
              />
            ))}

            {/* O texto: fluxo contínuo sobre a pilha, dentro das margens */}
            <div
              ref={flowRef}
              className="folium-flow"
              style={{
                top: geo.top,
                left: geo.left,
                width: geo.contentWidth,
                minHeight: geo.contentHeight,
              }}
            >
              <EditorContent editor={editor} />
            </div>

            {/* Vãos entre folhas: cobrem qualquer bloco alto que atravesse */}
            {Array.from({ length: Math.max(pageCount - 1, 0) }, (_, i) => (
              <div
                key={`seam-${i}`}
                className="folium-seam"
                style={{ top: sheetTop(i) + PAGE_HEIGHT_PX, height: PAGE_GAP_PX }}
                aria-hidden
              />
            ))}

            <PageOverlay pageCount={pageCount} header={header} footer={footer} geo={geo} />
          </div>
        </div>
      </div>

      {/* Folhas de impressão — vazio na tela, preenchido no `beforeprint`. */}
      <div className="folium-print" ref={printRef} aria-hidden />
    </div>
  );
}

/** Resolve os tokens {n} (página atual) e {total} (total de páginas). */
function resolveTokens(text: string, page: number, total: number): string {
  return text.replace(/\{n\}/g, String(page)).replace(/\{total\}/g, String(total));
}

/**
 * Cabeçalho e rodapé — desenhados nas margens de cada folha, por cima do texto.
 * Agora que a paginação é real, cada um cai na margem certa da sua folha, sem
 * sobrepor parágrafo nenhum.
 *
 * Sem numeração automática: quem quiser número de página escreve `{n}` (ou
 * `{n}/{total}`) no rodapé, e ele sai também no papel. Uma numeração desenhada
 * por padrão só duplicaria essa função e apareceria em documento que não pediu.
 */
function PageOverlay({
  pageCount,
  header,
  footer,
  geo,
}: {
  pageCount: number;
  header: string;
  footer: string;
  geo: PageGeometry;
}) {
  const hasHeader = header.trim() !== "";
  const hasFooter = footer.trim() !== "";
  return (
    <div className="folium-page-overlay" aria-hidden>
      {Array.from({ length: pageCount }, (_, i) => {
        const top = sheetTop(i);
        const bottom = top + PAGE_HEIGHT_PX;
        return (
          <div key={i}>
            {hasHeader && (
              <div
                className="folium-hf folium-hf-header"
                style={{
                  top: top + geo.top * 0.42,
                  left: geo.left,
                  right: geo.right,
                }}
              >
                {resolveTokens(header, i + 1, pageCount)}
              </div>
            )}
            {hasFooter && (
              <div
                className="folium-hf folium-hf-footer"
                style={{
                  top: bottom - geo.bottom * 0.62,
                  left: geo.left,
                  right: geo.right,
                }}
              >
                {resolveTokens(footer, i + 1, pageCount)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
