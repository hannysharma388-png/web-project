import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell, Sector
} from 'recharts';
import api from '../utils/api';

const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6'];

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xl font-bold uppercase tracking-wider">
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 10}
                outerRadius={outerRadius + 15}
                fill={fill}
            />
        </g>
    );
};

export default function AnalyticsView({ role, userId }) {
    const [subjects, setSubjects] = useState([]);
    
    // Filters
    const [subjectId, setSubjectId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Data payload
    const [trends, setTrends] = useState([]);
    const [summary, setSummary] = useState([]);
    const [performance, setPerformance] = useState([]);
    
    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [drilldown, setDrilldown] = useState(null);

    const printRef = useRef(null);

    const handleExportPDF = async () => {
        const element = printRef.current;
        if (!element) return;
        
        setIsExporting(true);
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
            pdf.save(`Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Failed to export PDF', err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDrilldown = (data, type) => {
        if (data) {
            setDrilldown({ data, type });
        }
    };

    const closeDrilldown = () => setDrilldown(null);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await api.get('/academic/subjects/faculty');
                setSubjects(res.data);
                if (res.data.length > 0) {
                    setSubjectId(res.data[0]._id);
                    if (res.data[0].sections?.length > 0) {
                        setSectionId(res.data[0].sections[0]._id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch subjects', err);
            }
        };
        fetchSubjects();
    }, [role, userId]);

    useEffect(() => {
        if (subjectId) {
            fetchAnalytics();
        }
    }, [subjectId, sectionId, startDate, endDate, role, userId]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (subjectId) queryParams.append('subjectId', subjectId);
            if (sectionId) queryParams.append('sectionId', sectionId);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            
            // 1. Fetch Trends
            const trendsRes = await api.get(`/reports/attendance-trends?${queryParams.toString()}`);
            setTrends(trendsRes.data);

            // 2. Fetch Summary
            const sumRes = await api.get(`/reports/attendance-summary?${queryParams.toString()}`);
            const sumData = sumRes.data;
            const formattedSummary = [
                { name: 'Present', value: sumData.present || 0 },
                { name: 'Absent', value: sumData.absent || 0 },
                { name: 'Late', value: sumData.late || 0 }
            ].filter(s => s.value > 0);
            setSummary(formattedSummary);

            // 3. Fetch Performance
            const perfParams = new URLSearchParams();
            if (role === 'faculty' && userId) {
                perfParams.append('authorId', userId);
            }
            const perfRes = await api.get(`/reports/performance-metrics?${perfParams.toString()}`);
            setPerformance(perfRes.data);

        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setIsLoading(false);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700">
                    <p className="font-bold text-gray-800 dark:text-white mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            <span className="font-semibold uppercase tracking-wider">{entry.name}:</span> {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const selectedSubject = subjects.find(s => s._id === subjectId);

    return (
        <div className="animate-fade-in space-y-8">
            {/* Control Panel */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Subject</label>
                    <select 
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                        value={subjectId}
                        onChange={(e) => {
                            setSubjectId(e.target.value);
                            const subj = subjects.find(s => s._id === e.target.value);
                            if (subj?.sections?.length > 0) setSectionId(subj.sections[0]._id);
                            else setSectionId('');
                        }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Section</label>
                    <select 
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                        value={sectionId}
                        onChange={(e) => setSectionId(e.target.value)}
                        disabled={!subjectId}
                    >
                        <option value="">All Sections</option>
                        {selectedSubject?.sections?.map(sec => (
                            <option key={sec._id} value={sec._id}>{sec.name} ({sec.branch})</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Start Date</label>
                    <input 
                        type="date"
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">End Date</label>
                    <input 
                        type="date"
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="pl-4 flex gap-4">
                    <button onClick={fetchAnalytics} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all">
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Apply'}
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 flex items-center gap-2">
                        {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                        Export PDF
                    </button>
                </div>
            </div>

            <div ref={printRef} className="space-y-8 bg-gray-50 dark:bg-slate-950 p-4 rounded-3xl">
                {/* Top Charts: Pie Summary & Bar Drilldown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Summary Pie */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-col items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 self-start">Overall Attendance Summary</h3>
                    {summary.length > 0 ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        activeIndex={activeIndex}
                                        activeShape={renderActiveShape}
                                        data={summary}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        onMouseEnter={onPieEnter}
                                        onClick={(data) => handleDrilldown(data, 'Attendance Status')}
                                        className="cursor-pointer"
                                    >
                                        {summary.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 min-h-[320px]"><i className="fas fa-chart-pie text-4xl mb-4 text-gray-200"></i><p>No Data Available</p></div>
                    )}
                </div>

                {/* Performance Bar Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance Metrics</h3>
                    {performance.length > 0 ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer>
                                <BarChart 
                                    data={performance} 
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                    onClick={(state) => {
                                        if (state && state.activePayload) {
                                            handleDrilldown(state.activePayload[0].payload, 'Performance Details');
                                        }
                                    }}
                                    className="cursor-pointer"
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis hide domain={[0, 100]} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="averagePercentage" name="Avg Rate (%)" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 h-80 flex flex-col items-center justify-center text-gray-400"><i className="fas fa-chart-bar text-4xl mb-4 text-gray-200"></i><p>No Data Available</p></div>
                    )}
                </div>
            </div>

            {/* Bottom Chart: Trends LineChart */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Daily Attendance Trends</h3>
                {trends.length > 0 ? (
                    <div className="w-full h-96">
                        <ResponsiveContainer>
                            <LineChart 
                                data={trends} 
                                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                onClick={(state) => {
                                    if (state && state.activePayload) {
                                        handleDrilldown(state.activePayload[0].payload, 'Daily Trend Details');
                                    }
                                }}
                                className="cursor-pointer"
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis axisLine={false} tickLine={false} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                <Line type="monotone" dataKey="present" name="Present" stroke="#10b981" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} />
                                <Line type="monotone" dataKey="late" name="Late" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="w-full h-80 flex flex-col items-center justify-center text-gray-400"><i className="fas fa-chart-line text-4xl mb-4 text-gray-200"></i><p>No Data Available</p></div>
                )}
            </div>
            </div>

            {/* Drilldown Modal */}
            {drilldown && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-700 relative">
                        <button 
                            onClick={closeDrilldown}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <i className="fas fa-search-plus"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {drilldown.type}
                            </h3>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-6 border border-gray-100 dark:border-slate-700/50">
                            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-slate-700 pb-2">
                                Selected Metric Data
                            </h4>
                            <div className="space-y-3">
                                {Object.entries(drilldown.data).map(([key, val]) => {
                                    if (key === 'payload' || key === 'cx' || key === 'cy' || key === 'innerRadius' || key === 'outerRadius' || key === 'startAngle' || key === 'endAngle' || key === 'fill' || key === 'stroke' || key === 'tooltipPayload' || key === 'tooltipPosition') return null;
                                    
                                    // Format the key to be more readable
                                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    
                                    return (
                                        <div key={key} className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{formattedKey}</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {typeof val === 'object' ? JSON.stringify(val) : val}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button 
                                onClick={closeDrilldown} 
                                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-xl font-medium transition-colors"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
