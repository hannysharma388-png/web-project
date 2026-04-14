import React, { useState, useEffect } from 'react';
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
    const [courses, setCourses] = useState([]);
    
    // Filters
    const [classId, setClassId] = useState('');
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
    const [activeIndex, setActiveIndex] = useState(0);

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/academic/courses');
                let crs = Array.isArray(res.data) ? res.data : [];
                if (role === 'faculty') {
                    crs = crs.filter(c => c.faculty && c.faculty.some(f => f._id === userId));
                }
                setCourses(crs);
                if (crs.length > 0) setClassId(crs[0]._id);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCourses();
    }, [role, userId]);

    useEffect(() => {
        fetchAnalytics();
    }, [classId, startDate, endDate, role, userId]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (classId) queryParams.append('classId', classId);
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

    return (
        <div className="animate-fade-in space-y-8">
            {/* Control Panel */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-2">Filter By Course</label>
                    <select 
                        className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all"
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                    >
                        <option value="">All Courses</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
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
                <div className="pl-4">
                    <button onClick={fetchAnalytics} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all">
                        {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Apply'}
                    </button>
                </div>
            </div>

            {/* Top Charts: Pie Summary & Bar Drilldown (simulated as separate charts side by side) */}
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
                                    >
                                        {summary.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400"><i className="fas fa-chart-pie text-4xl mb-4 text-gray-200"></i><p>No Data Available</p></div>
                    )}
                </div>

                {/* Performance Bar Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700/50">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance Metrics</h3>
                    {performance.length > 0 ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer>
                                <BarChart data={performance} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
                            <LineChart data={trends} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
    );
}
