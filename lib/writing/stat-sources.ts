import { createClient } from "@/lib/supabase/client";
import type { DatasetColumnType } from "@/lib/types/database";

// Fonte de estatística embutível na Escrita. Hoje o app tem planilhas de dados
// (datasets); gráficos ainda não existem como entidade. O tipo já prevê
// `chart` para quando a aba Estatística ganhar gráficos — o node StatChart lê
// o `kind` para decidir como renderizar.
export type StatSourceKind = "table" | "chart";

export type StatSourceSummary = {
  id: string;
  kind: StatSourceKind;
  name: string;
  description: string | null;
  updatedAt: string;
  columnCount: number;
  rowCount: number;
  /** Primeiras colunas, para a miniatura no painel. */
  columnPreview: string[];
};

export type StatSourceColumn = {
  id: string;
  name: string;
  dataType: DatasetColumnType;
  position: number;
};

export type StatSourceData = {
  id: string;
  kind: StatSourceKind;
  name: string;
  description: string | null;
  updatedAt: string;
  columns: StatSourceColumn[];
  rows: Array<{ id: string; data: Record<string, unknown> }>;
};

/**
 * Lista as fontes de estatística do projeto (planilhas de dados) para o painel
 * de inserção. Faz poucas consultas amplas em vez de uma por planilha.
 */
export async function listStatSources(projectId: string): Promise<StatSourceSummary[]> {
  const supabase = createClient();

  const [datasetsRes, columnsRes, rowsRes] = await Promise.all([
    supabase
      .from("datasets")
      .select("id, name, description, updated_at")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("dataset_columns")
      .select("id, dataset_id, name, position")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
    // Só os ids — leve o suficiente para contar linhas por planilha no cliente.
    supabase.from("dataset_rows").select("dataset_id").eq("project_id", projectId),
  ]);

  const datasets = datasetsRes.data ?? [];
  const columns = columnsRes.data ?? [];
  const rows = rowsRes.data ?? [];

  const columnsByDataset = new Map<string, string[]>();
  for (const col of columns) {
    const list = columnsByDataset.get(col.dataset_id) ?? [];
    list.push(col.name);
    columnsByDataset.set(col.dataset_id, list);
  }

  const rowCountByDataset = new Map<string, number>();
  for (const row of rows) {
    rowCountByDataset.set(row.dataset_id, (rowCountByDataset.get(row.dataset_id) ?? 0) + 1);
  }

  return datasets.map((ds) => {
    const cols = columnsByDataset.get(ds.id) ?? [];
    return {
      id: ds.id,
      kind: "table" as const,
      name: ds.name,
      description: ds.description,
      updatedAt: ds.updated_at,
      columnCount: cols.length,
      rowCount: rowCountByDataset.get(ds.id) ?? 0,
      columnPreview: cols.slice(0, 4),
    };
  });
}

/**
 * Carrega os dados vivos de uma fonte para renderizar dentro do texto. Retorna
 * `null` se a planilha foi excluída (o node mostra um placeholder).
 */
export async function getStatSource(statId: string): Promise<StatSourceData | null> {
  const supabase = createClient();

  const { data: dataset } = await supabase
    .from("datasets")
    .select("id, name, description, updated_at")
    .eq("id", statId)
    .maybeSingle();

  if (!dataset) return null;

  const [columnsRes, rowsRes] = await Promise.all([
    supabase
      .from("dataset_columns")
      .select("id, name, data_type, position")
      .eq("dataset_id", statId)
      .order("position", { ascending: true }),
    supabase
      .from("dataset_rows")
      .select("id, data, position")
      .eq("dataset_id", statId)
      .order("position", { ascending: true }),
  ]);

  return {
    id: dataset.id,
    kind: "table",
    name: dataset.name,
    description: dataset.description,
    updatedAt: dataset.updated_at,
    columns: (columnsRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      dataType: c.data_type as DatasetColumnType,
      position: c.position,
    })),
    rows: (rowsRes.data ?? []).map((r) => ({
      id: r.id,
      data: (r.data ?? {}) as Record<string, unknown>,
    })),
  };
}
