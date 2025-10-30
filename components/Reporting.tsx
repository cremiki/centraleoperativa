import React, { useState, useEffect, useContext } from 'react';
import { Report, ReportType } from '../types';
import { maponService } from '../services/maponService';
import { DataContext } from '../contexts/DataContext';

const ReportModal: React.FC<{ onClose: () => void; onGenerate: (report: Report) => void; }> = ({ onClose, onGenerate }) => {
    const { units } = useContext(DataContext);
    const [reportType, setReportType] = useState<ReportType>(ReportType.MILEAGE);
    const [deviceIds, setDeviceIds] = useState<number[]>([]);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        setDateRange({
            from: lastWeek.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0]
        });
    }, []);

    const handleGenerate = async () => {
        if (deviceIds.length === 0 || !dateRange.from || !dateRange.to) {
            alert('Please select at least one device and a valid date range.');
            return;
        }
        setLoading(true);
        const report = await maponService.generateReport(reportType, dateRange, deviceIds);
        onGenerate(report);
        setLoading(false);
        onClose();
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.checked) {
            setDeviceIds(units.map(u => u.unit_id));
        } else {
            setDeviceIds([]);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1100]">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-4">Generate New Report</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 font-bold">Report Type</label>
                        <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="w-full p-2 rounded bg-gray-700">
                            {Object.values(ReportType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 font-bold">Devices</label>
                        <div className="max-h-40 overflow-y-auto bg-gray-900 p-2 rounded border border-gray-700">
                            <div className="flex items-center mb-2">
                                <input type="checkbox" onChange={handleSelectAll} id="select-all" className="mr-2" />
                                <label htmlFor="select-all">Select All</label>
                            </div>
                            {units.map(unit => (
                                <div key={unit.unit_id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`unit-${unit.unit_id}`}
                                        className="mr-2"
                                        checked={deviceIds.includes(unit.unit_id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setDeviceIds([...deviceIds, unit.unit_id]);
                                            } else {
                                                setDeviceIds(deviceIds.filter(id => id !== unit.unit_id));
                                            }
                                        }}
                                    />
                                    <label htmlFor={`unit-${unit.unit_id}`}>{unit.number}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block mb-2 font-bold">From</label>
                            <input type="date" value={dateRange.from} onChange={e => setDateRange(prev => ({...prev, from: e.target.value}))} className="w-full p-2 rounded bg-gray-700" />
                        </div>
                        <div className="flex-1">
                            <label className="block mb-2 font-bold">To</label>
                            <input type="date" value={dateRange.to} onChange={e => setDateRange(prev => ({...prev, to: e.target.value}))} className="w-full p-2 rounded bg-gray-700" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50" disabled={loading}>Cancel</button>
                    <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50" disabled={loading}>
                        {loading ? "Generating..." : "Generate"}
                    </button>
                </div>
            </div>
        </div>
    );
};


export const Reporting: React.FC = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        maponService.getReports().then(setReports);
    }, []);

    const addReport = (report: Report) => {
        setReports([report, ...reports]);
    };

    return (
        <div className="bg-gray-900 h-full p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Reporting</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-500">
                    Generate New Report
                </button>
            </div>
            {reports.length === 0 ? (
                <p className="text-gray-400">No reports generated yet.</p>
            ) : (
                <div className="bg-gray-800 rounded-lg shadow-lg">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                            <tr>
                                <th className="p-4">Report Type</th>
                                <th className="p-4">Date Range</th>
                                <th className="p-4">Generated At</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {reports.map(report => (
                            <tr key={report.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-4 font-semibold">{report.type}</td>
                                <td className="p-4">{report.dateRange.from} to {report.dateRange.to}</td>
                                <td className="p-4">{new Date(report.generatedAt).toLocaleString()}</td>
                                <td className="p-4 space-x-2">
                                    <button className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500 text-sm">Download PDF</button>
                                    <button className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm">Download CSV</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
            {isModalOpen && <ReportModal onClose={() => setIsModalOpen(false)} onGenerate={addReport} />}
        </div>
    );
};
