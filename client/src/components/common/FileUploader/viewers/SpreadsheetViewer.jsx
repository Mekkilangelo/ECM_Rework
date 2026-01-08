import React, { useMemo } from 'react';
import { DataGrid } from 'react-data-grid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Button, ButtonGroup } from 'react-bootstrap';
import './SpreadsheetViewer.css';
import 'react-data-grid/lib/styles.css';

const SpreadsheetViewer = ({
  sheetData,
  sheetNames,
  activeSheet,
  onSheetChange,
  fileName,
  fileUrl
}) => {
  const isDarkTheme = document.documentElement.classList.contains('dark-theme');

  const { columns, rows } = useMemo(() => {
    if (!sheetData || sheetData.length === 0) {
      return { columns: [], rows: [] };
    }

    const firstRow = sheetData[0];
    const hasHeader = firstRow && firstRow.some(cell =>
      typeof cell === 'string' && isNaN(cell) && cell.trim() !== ''
    );

    const headerRow = hasHeader ? firstRow : null;
    const dataRows = hasHeader ? sheetData.slice(1) : sheetData;

    const numColumns = Math.max(...sheetData.map(row =>
      Array.isArray(row) ? row.length : Object.keys(row).length
    ));

    const cols = Array.from({ length: numColumns }, (_, idx) => ({
      key: `col${idx}`,
      name: headerRow ?
        (headerRow[idx] !== null && headerRow[idx] !== undefined ? String(headerRow[idx]) : `Colonne ${idx + 1}`) :
        `Colonne ${idx + 1}`,
      resizable: true,
      sortable: true,
      width: 150,
      formatter: ({ row }) => {
        const value = row[`col${idx}`];
        if (value === null || value === undefined || value === '') {
          return <span className="empty-cell">-</span>;
        }
        return <span>{String(value)}</span>;
      }
    }));

    const rowsData = dataRows.map((row, rowIdx) => {
      const rowObj = { id: rowIdx };
      if (Array.isArray(row)) {
        row.forEach((cell, cellIdx) => {
          rowObj[`col${cellIdx}`] = cell;
        });
      } else {
        Object.entries(row).forEach(([key, value], cellIdx) => {
          rowObj[`col${cellIdx}`] = value;
        });
      }
      return rowObj;
    });

    return { columns: cols, rows: rowsData };
  }, [sheetData]);

  if (!sheetData || sheetData.length === 0) {
    return (
      <div className="spreadsheet-viewer-empty">
        <p>Aucune donnée à afficher</p>
        {fileUrl && (
          <a href={fileUrl} className="btn btn-primary mt-2" download={fileName}>
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Télécharger le fichier
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`spreadsheet-viewer-container ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="spreadsheet-toolbar">
        {sheetNames && sheetNames.length > 1 && (
          <div className="spreadsheet-sheet-tabs">
            <ButtonGroup size="sm">
              {sheetNames.map((name, index) => (
                <Button
                  key={index}
                  variant={index === activeSheet ? 'primary' : (isDarkTheme ? 'outline-light' : 'outline-secondary')}
                  onClick={() => onSheetChange(index)}
                  className="sheet-tab"
                >
                  {name}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        )}
        <div className="spreadsheet-actions">
          <Button
            variant="primary"
            size="sm"
            as="a"
            href={fileUrl}
            download={fileName}
            title="Télécharger"
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Télécharger
          </Button>
        </div>
      </div>

      <div className="spreadsheet-grid-wrapper">
        <DataGrid
          columns={columns}
          rows={rows}
          defaultColumnOptions={{
            resizable: true,
            sortable: true
          }}
          className={`spreadsheet-grid ${isDarkTheme ? 'rdg-dark' : 'rdg-light'}`}
          style={{ height: '100%' }}
          rowHeight={35}
          headerRowHeight={40}
        />
      </div>

      <div className="spreadsheet-footer">
        <small className="text-muted">
          {rows.length} ligne{rows.length > 1 ? 's' : ''} × {columns.length} colonne{columns.length > 1 ? 's' : ''}
        </small>
      </div>
    </div>
  );
};

export default SpreadsheetViewer;
