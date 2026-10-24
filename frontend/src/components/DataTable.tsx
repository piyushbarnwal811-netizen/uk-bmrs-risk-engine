import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Search, 
  ArrowUpDown, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { WindRecord } from '../types';

interface DataTableProps {
  data: WindRecord[];
  onExportCsv: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, onExportCsv }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'SHORT' | 'SURPLUS'>('ALL');
  const [sortField, setSortField] = useState<keyof WindRecord>('startTime');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Filter & Search
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch =
        row.settlementDate.includes(searchTerm) ||
        row.startTime.includes(searchTerm) ||
        row.settlementPeriod.toString().includes(searchTerm);

      const matchesDirection =
        directionFilter === 'ALL' || row.imbalanceDirection === directionFilter;

      return matchesSearch && matchesDirection;
    });
  }, [data, searchTerm, directionFilter]);

  // Sort
  const sortedData = useMemo(() => {
    const list = [...filteredData];
    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return list;
  }, [filteredData, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const handleSort = (field: keyof WindRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  return (
    <div className="bg-trading-card border border-trading-border rounded-xl p-4 shadow-xl flex flex-col">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-trading-border mb-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Settlement Period Ledger & Outturn Reconciliations
          </h2>
          <span className="text-[11px] font-mono text-trading-muted bg-trading-bg px-2 py-0.5 rounded border border-trading-border">
            {sortedData.length} Records
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-trading-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter Date (e.g. 2026-01-21) or SP..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-trading-bg text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-trading-border focus:outline-none focus:border-sky-500 w-56 font-mono"
            />
          </div>

          {/* Direction Filter Tabs */}
          <div className="flex items-center bg-trading-bg p-0.5 rounded-lg border border-trading-border text-xs">
            {(['ALL', 'SHORT', 'SURPLUS'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => {
                  setDirectionFilter(dir);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  directionFilter === dir
                    ? dir === 'SHORT'
                      ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                      : dir === 'SURPLUS'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                      : 'bg-trading-card text-sky-400 font-semibold shadow-sm'
                    : 'text-trading-muted hover:text-slate-300'
                }`}
              >
                {dir === 'ALL' ? 'All' : dir === 'SHORT' ? 'Short Only' : 'Surplus Only'}
              </button>
            ))}
          </div>

          {/* Quick Export */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-trading-bg hover:bg-trading-cardHover border border-trading-border rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-trading-border text-trading-muted text-[11px] bg-trading-bg/40">
              <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('settlementDate')}>
                <div className="flex items-center gap-1">
                  <span>Date / Time</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-2 cursor-pointer hover:text-white text-center" onClick={() => handleSort('settlementPeriod')}>
                <div className="flex items-center justify-center gap-1">
                  <span>SP</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort('actualGenerationMW')}>
                <div className="flex items-center justify-end gap-1 text-emerald-400">
                  <span>Actual (MW)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort('forecastGenerationMW')}>
                <div className="flex items-center justify-end gap-1 text-indigo-400">
                  <span>Forecast (MW)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort('errorMW')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Error (MW)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-2 text-right">Error %</th>
              <th className="py-2.5 px-3 text-center">Desk Position</th>
              <th className="py-2.5 px-3 text-left">Forecast Published</th>
              <th className="py-2.5 px-2 text-right">Lead Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-trading-border/60">
            {paginatedData.map((row, idx) => {
              const dt = new Date(row.startTime);
              const timeFormatted = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
              const isShort = row.errorMW > 0;
              
              return (
                <tr key={`${row.startTime}-${idx}`} className="hover:bg-trading-cardHover/70 transition-colors">
                  <td className="py-2.5 px-3 text-slate-200 whitespace-nowrap">
                    <span className="font-semibold text-white">{row.settlementDate}</span>{' '}
                    <span className="text-trading-muted">{timeFormatted} UTC</span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-trading-bg border border-trading-border text-[11px]">
                      {row.settlementPeriod}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    {row.actualGenerationMW.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-indigo-400">
                    {row.forecastGenerationMW.toLocaleString()}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold ${isShort ? 'text-rose-400' : 'text-amber-400'}`}>
                    {row.errorMW > 0 ? `+${row.errorMW.toLocaleString()}` : row.errorMW.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300">
                    {row.errorPercentage ? `${row.errorPercentage.toFixed(1)}%` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.imbalanceDirection === 'SHORT'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : row.imbalanceDirection === 'SURPLUS'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {row.imbalanceDirection === 'SHORT' ? (
                        <>
                          <ArrowUpRight className="w-2.5 h-2.5" /> SHORT
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-2.5 h-2.5" /> SURPLUS
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(row.publishTime).toUTCString().slice(5, 22)}
                  </td>
                  <td className="py-2.5 px-2 text-right text-sky-300 text-[11px]">
                    {row.leadTimeHours}h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-trading-border mt-3 text-xs text-trading-muted font-mono">
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} settlement periods
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-trading-bg hover:bg-trading-cardHover border border-trading-border disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>
          <span className="px-3 py-1 rounded bg-trading-bg border border-trading-border text-white font-bold">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-trading-bg hover:bg-trading-cardHover border border-trading-border disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
