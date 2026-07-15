"use client";

import { useRef, useState } from "react";
import { DataGrid as ReactDataGrid, renderTextEditor, type Column } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { addColumn, addRow, deleteColumn, deleteRow, updateRowData } from "@/lib/actions/datasets";
import type { DatasetColumnType } from "@/lib/types/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type DatasetColumn = { id: string; name: string; data_type: DatasetColumnType; position: number };
type DatasetRow = { id: string; data: Record<string, unknown> };
type GridRow = { id: string } & Record<string, unknown>;

const COLUMN_TYPE_LABELS: Record<DatasetColumnType, string> = {
  text: "Texto",
  number: "Número",
  integer: "Número inteiro",
  date: "Data",
  boolean: "Sim/Não",
  categorical: "Categoria",
};

function toGridRows(rows: DatasetRow[], columns: DatasetColumn[]): GridRow[] {
  return rows.map((row) => {
    const gridRow: GridRow = { id: row.id };
    for (const col of columns) gridRow[col.id] = row.data[col.id] ?? "";
    return gridRow;
  });
}

export function DataGrid({
  projectId,
  datasetId,
  initialColumns,
  initialRows,
}: {
  projectId: string;
  datasetId: string;
  initialColumns: DatasetColumn[];
  initialRows: DatasetRow[];
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [rows, setRows] = useState<GridRow[]>(() => toGridRows(initialRows, initialColumns));
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<DatasetColumnType>("text");
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const gridColumns: Column<GridRow>[] = [
    ...columns.map(
      (col): Column<GridRow> => ({
        key: col.id,
        name: `${col.name} (${COLUMN_TYPE_LABELS[col.data_type]})`,
        editable: true,
        resizable: true,
        renderEditCell: renderTextEditor,
      }),
    ),
    {
      key: "__actions",
      name: "",
      width: 40,
      renderCell: ({ row }) => (
        <button
          type="button"
          onClick={async () => {
            setRows((prev) => prev.filter((r) => r.id !== row.id));
            await deleteRow(row.id, projectId, datasetId);
          }}
          className="text-zinc-400 hover:text-red-600"
          title="Excluir linha"
        >
          ✕
        </button>
      ),
    },
  ];

  function handleRowsChange(newRows: GridRow[]) {
    setRows(newRows);
    for (const row of newRows) {
      if (saveTimers.current[row.id]) clearTimeout(saveTimers.current[row.id]);
      saveTimers.current[row.id] = setTimeout(() => {
        const { id, ...data } = row;
        void id;
        updateRowData(row.id, data);
      }, 600);
    }
  }

  async function handleAddRow() {
    const newId = await addRow(datasetId, projectId, rows.length);
    const emptyRow: GridRow = { id: newId };
    for (const col of columns) emptyRow[col.id] = "";
    setRows((prev) => [...prev, emptyRow]);
  }

  async function handleAddColumn() {
    if (!newColumnName.trim()) return;
    const newId = await addColumn(datasetId, projectId, newColumnName, newColumnType, columns.length);
    setColumns((prev) => [
      ...prev,
      { id: newId, name: newColumnName, data_type: newColumnType, position: prev.length },
    ]);
    setRows((prev) => prev.map((row) => ({ ...row, [newId]: "" })));
    setNewColumnName("");
    setNewColumnType("text");
    setShowAddColumn(false);
  }

  async function handleDeleteColumn(columnId: string) {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    await deleteColumn(columnId, projectId, datasetId);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleAddRow} variant="secondary">
          + Linha
        </Button>
        {showAddColumn ? (
          <div className="flex items-center gap-2">
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Nome da coluna"
              className="w-40"
              autoFocus
            />
            <select
              value={newColumnType}
              onChange={(e) => setNewColumnType(e.target.value as DatasetColumnType)}
              className="rounded-md border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {Object.entries(COLUMN_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Button onClick={handleAddColumn}>Adicionar</Button>
            <Button variant="ghost" onClick={() => setShowAddColumn(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setShowAddColumn(true)}>
            + Coluna
          </Button>
        )}
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Adicione ao menos uma coluna para começar a inserir dados.
        </p>
      ) : (
        <>
          <ReactDataGrid
            columns={gridColumns}
            rows={rows}
            onRowsChange={handleRowsChange}
            rowKeyGetter={(row) => row.id}
            className="rdg-light dark:rdg-dark"
            style={{ blockSize: "auto", maxHeight: "70vh" }}
          />
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => (
              <span
                key={col.id}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {col.name}
                <button
                  type="button"
                  onClick={() => handleDeleteColumn(col.id)}
                  className="text-zinc-400 hover:text-red-600"
                  title="Excluir coluna"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
