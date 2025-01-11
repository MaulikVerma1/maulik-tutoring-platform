'use client';

type DonutChartProps = {
	value: number;
	total: number;
	color: string;
	size?: number;
};

export default function DonutChart({ value, total, color, size = 120 }: DonutChartProps) {
	const percentage = total === 0 ? 0 : (value / total) * 100;
	const strokeWidth = 10;
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg
				className="transform -rotate-90"
				width={size}
				height={size}
			>
				<circle
					className="text-gray-200"
					strokeWidth={strokeWidth}
					stroke="currentColor"
					fill="transparent"
					r={radius}
					cx={size / 2}
					cy={size / 2}
				/>
				<circle
					className="transition-all duration-300"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					stroke={color}
					fill="transparent"
					r={radius}
					cx={size / 2}
					cy={size / 2}
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				<span className="text-lg font-semibold">
					{value}/{total}
				</span>
			</div>
		</div>
	);
}