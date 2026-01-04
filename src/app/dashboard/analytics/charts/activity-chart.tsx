"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface ActivityChartProps {
    data: any[]
    title: string
    description?: string
    dataKey: string
    color?: string
}

export function ActivityChart({
    data,
    title,
    description,
    dataKey,
    color = "#adfa1d"
}: ActivityChartProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                allowDecimals={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px' }}
                            />
                            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
