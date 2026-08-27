import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ArrowLeft,
  RefreshCw,
  Clock3,
  Globe2,
  AlertTriangle,
} from 'lucide-react';

type Impact = 'High' | 'Medium' | 'Low';

interface CalendarEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: Impact;
  forecast?: string;
  previous?: string;
  actual?: string;
}

const FALLBACK_EVENTS: CalendarEvent[] = [
  {
    id: 'usd-cpi',
    time: '10:00',
    currency: 'USD',
    event: 'Consumer Price Index (CPI)',
    impact: 'High',
    forecast: '3.1%',
    previous: '3.0%',
  },
  {
    id: 'eur-ecb',
    time: '11:30',
    currency: 'EUR',
    event: 'ECB Interest Rate Decision',
    impact: 'High',
    forecast: '2.15%',
    previous: '2.15%',
  },
  {
    id: 'gbp-gdp',
    time: '13:00',
    currency: 'GBP',
    event: 'GDP Growth Rate',
    impact: 'Medium',
    forecast: '0.2%',
    previous: '0.1%',
  },
  {
    id: 'usd-retail',
    time: '15:30',
    currency: 'USD',
    event: 'Retail Sales',
    impact: 'Medium',
    forecast: '0.4%',
    previous: '0.3%',
  },
  {
    id: 'jpy-pmi',
    time: '18:00',
    currency: 'JPY',
    event: 'Manufacturing PMI',
    impact: 'Low',
    forecast: '49.8',
    previous: '49.7',
  },
];

function impactClass(impact: Impact) {
  if (impact === 'High') {
    return 'bg-rose-500/10 border-rose-500/20 text-rose-300';
  }

  if (impact === 'Medium') {
    return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
  }

  return 'bg-zinc-800/60 border-zinc-700 text-zinc-400';
}

export default function EconomicCalendar() {
  const [events, setEvents] =
    useState<CalendarEvent[]>(FALLBACK_EVENTS);

  const [impactFilter, setImpactFilter] =
    useState<'All' | Impact>('All');

  const [currencyFilter, setCurrencyFilter] =
    useState('All');

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  const loadCalendar = async () => {
    setLoading(true);

    try {
      const endpoint =
        import.meta.env.VITE_ECONOMIC_CALENDAR_URL;

      if (endpoint) {
        const response = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(
            `Calendar request failed: ${response.status}`
          );
        }

        const data = await response.json();

        const normalized: CalendarEvent[] =
          Array.isArray(data)
            ? data
                .map((item: any, index: number) => ({
                  id: String(
                    item.id ??
                      item.eventId ??
                      `${index}-${item.event ?? item.name ?? 'event'}`
                  ),
                  time: String(
                    item.time ??
                      item.datetime ??
                      item.date ??
                      '--:--'
                  ),
                  currency: String(
                    item.currency ??
                      item.country ??
                      item.ccy ??
                      '--'
                  ),
                  event: String(
                    item.event ??
                      item.name ??
                      item.title ??
                      'Economic Event'
                  ),
                  impact:
                    item.impact === 'High' ||
                    item.impact === 'Medium'
                      ? item.impact
                      : 'Low',
                  forecast:
                    item.forecast == null
                      ? undefined
                      : String(item.forecast),
                  previous:
                    item.previous == null
                      ? undefined
                      : String(item.previous),
                  actual:
                    item.actual == null
                      ? undefined
                      : String(item.actual),
                }))
                .filter(
                  (item) =>
                    item.event &&
                    item.currency &&
                    item.time
                )
            : [];

        if (normalized.length > 0) {
          setEvents(normalized);
        }
      }
    } catch (error) {
      console.warn(
        'Economic calendar endpoint unavailable. Showing fallback calendar.',
        error
      );
    } finally {
      setLastUpdated(new Date());
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();

    const interval = window.setInterval(
      loadCalendar,
      5 * 60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const currencies = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(events.map((item) => item.currency))
      ).sort(),
    ],
    [events]
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((item) => {
        const impactMatch =
          impactFilter === 'All' ||
          item.impact === impactFilter;

        const currencyMatch =
          currencyFilter === 'All' ||
          item.currency === currencyFilter;

        return impactMatch && currencyMatch;
      }),
    [events, impactFilter, currencyFilter]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-zinc-900 pb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-300 mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <CalendarDays className="w-7 h-7 text-amber-500" />
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Economic Calendar
              </h1>
            </div>

            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              Follow scheduled macroeconomic releases that may affect
              currencies, gold and global markets.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCalendar}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs font-bold text-zinc-300 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 font-bold">
                Upcoming events
              </p>
              <p className="text-sm text-zinc-300 font-semibold mt-1">
                Today
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={impactFilter}
                onChange={(event) =>
                  setImpactFilter(
                    event.target.value as
                      | 'All'
                      | Impact
                  )
                }
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 outline-none"
              >
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <select
                value={currencyFilter}
                onChange={(event) =>
                  setCurrencyFilter(
                    event.target.value
                  )
                }
                className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 outline-none"
              >
                {currencies.map((currency) => (
                  <option key={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 text-zinc-600 text-[10px] font-bold uppercase tracking-wider border-b border-zinc-900">
                  <th className="px-5 py-3">
                    Time
                  </th>
                  <th className="px-5 py-3">
                    Currency
                  </th>
                  <th className="px-5 py-3">
                    Event
                  </th>
                  <th className="px-5 py-3">
                    Impact
                  </th>
                  <th className="px-5 py-3">
                    Forecast
                  </th>
                  <th className="px-5 py-3">
                    Previous
                  </th>
                  <th className="px-5 py-3">
                    Actual
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-900/80 hover:bg-zinc-900/30"
                  >
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 text-xs font-mono text-white">
                        <Clock3 className="w-3.5 h-3.5 text-zinc-600" />
                        {item.time}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-zinc-300">
                        {item.currency}
                      </span>
                    </td>

                    <td className="px-5 py-4 min-w-[260px]">
                      <p className="text-xs font-semibold text-zinc-200">
                        {item.event}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-bold ${impactClass(
                          item.impact
                        )}`}
                      >
                        {item.impact}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs font-mono text-zinc-500">
                      {item.forecast || '—'}
                    </td>

                    <td className="px-5 py-4 text-xs font-mono text-zinc-500">
                      {item.previous || '—'}
                    </td>

                    <td className="px-5 py-4 text-xs font-mono text-zinc-300">
                      {item.actual || '—'}
                    </td>
                  </tr>
                ))}

                {filteredEvents.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-zinc-600"
                    >
                      No events match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-zinc-900 text-[10px] text-zinc-700">
            Last updated:{' '}
            {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-white">
                High Impact
              </h2>
            </div>

            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              High-impact releases can produce rapid price movement and
              wider spreads. Review scheduled events before entering a trade.
            </p>

            <div className="mt-4 space-y-2">
              {events
                .filter(
                  (item) =>
                    item.impact === 'High'
                )
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-amber-400">
                        {item.time}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500">
                        {item.currency}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-zinc-300 mt-2">
                      {item.event}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-bold text-white">
                Market Focus
              </h2>
            </div>

            <div className="mt-4 space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Gold</span>
                <span className="text-zinc-300">
                  USD events
                </span>
              </div>
              <div className="flex justify-between">
                <span>EUR pairs</span>
                <span className="text-zinc-300">
                  EUR events
                </span>
              </div>
              <div className="flex justify-between">
                <span>GBP pairs</span>
                <span className="text-zinc-300">
                  GBP events
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}