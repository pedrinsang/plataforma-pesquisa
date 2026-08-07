/**
 * Regras de quebra da paginação que não dependem do DOM.
 *
 * Ficam fora do `WritingCanvas` para poderem ser testadas: lá elas só existem no
 * meio de uma medição, e a única forma de conferir era digitar num documento até
 * a virada cair no lugar certo — que foi exatamente como o defeito de viúva e
 * órfã passou despercebido. Aqui é aritmética pura, e `npm test` cobre.
 */

/**
 * Mínimo de linhas de um mesmo parágrafo que ficam juntas de cada lado da
 * virada — controle de viúvas e órfãs, como num processador de texto.
 */
export const MIN_LINES = 2;

/**
 * Em que linha repartir um parágrafo cuja linha `overflow` já não cabe na folha.
 *
 * Devolve o índice da linha que **abre a folha de baixo**. Quando esse índice é
 * o próprio `paraStart`, não há corte possível respeitando viúva e órfã e o
 * parágrafo inteiro desce.
 *
 * São duas tentativas, nesta ordem — e a primeira é a que faltava:
 *
 * 1. **Sobe a quebra.** Cortar em `overflow` deixaria menos de `minLines` na
 *    folha de baixo (viúva)? Então corta antes, em `paraEnd - minLines`: o
 *    parágrafo ainda se reparte, só que mais acima.
 * 2. **Desce o parágrafo.** Se nem assim sobram `minLines` na folha de cima
 *    (órfã), não há corte que sirva.
 *
 * Sem o passo 1, um parágrafo de 4 linhas com espaço para 3 caía direto no
 * passo 2 e saltava **inteiro** para a folha seguinte, quando devia repartir
 * 2/2. Era o "às vezes manda mais de uma linha" — de fato mandava quatro.
 */
export function breakAtLine({
  paraStart,
  paraEnd,
  overflow,
  minLines = MIN_LINES,
}: {
  /** Índice da primeira linha do parágrafo (dentro das linhas do bloco). */
  paraStart: number;
  /** Índice logo depois da última linha do parágrafo. */
  paraEnd: number;
  /** Índice da linha que transbordou a folha. */
  overflow: number;
  minLines?: number;
}): number {
  let at = overflow;
  if (paraEnd - at < minLines) at = paraEnd - minLines;
  if (at - paraStart < minLines) at = paraStart;
  return at;
}
