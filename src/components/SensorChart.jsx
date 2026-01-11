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
        <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-semibold mb-4">{title}</h2>

            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        strokeWidth={2}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default SensorChart;


