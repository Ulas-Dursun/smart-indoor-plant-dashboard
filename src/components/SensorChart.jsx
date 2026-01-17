import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

function SensorChart({ data, dataKey, title }) {
    return (
        <div className="bg-white rounded-[2rem] p-6">
            <h2 className="text-xl font-bold mb-6 text-slate-800 tracking-tight">{title}</h2>

            <ResponsiveContainer width="100%" height={280}>

                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                    <XAxis
                        dataKey="time"

                        tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />

                    <YAxis
                        domain={[0, 100]}

                        width={35}
                        tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            fontSize: '12px'
                        }}
                    />

                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke="#3b82f6"
                        strokeWidth={4}
                        dot={false}
                        animationDuration={800}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default SensorChart;