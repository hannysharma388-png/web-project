import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const ReportsChart = ({ data, title }) => {
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="total"
            nameKey="_id"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReportsChart;
