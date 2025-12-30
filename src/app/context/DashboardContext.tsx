"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DataManager } from '../lib/data-manager';
import { Client, Appointment, FinancialRecord } from '../types';

interface DashboardMetrics {
    appointmentsToday: number;
    incomeMonth: number;
    newClientsMonth: number;
}

interface DashboardContextType {
    clients: Client[];
    appointments: Appointment[];
    financials: FinancialRecord[];
    metrics: DashboardMetrics;
    loading: boolean;
    refreshData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [financials, setFinancials] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        appointmentsToday: 0,
        incomeMonth: 0,
        newClientsMonth: 0
    });

    const refreshData = async () => {
        try {
            const [clientsData, appointmentsData, financialsData] = await Promise.all([
                DataManager.getClients(),
                DataManager.getAppointments(),
                DataManager.getFinancialSummary()
            ]);

            setClients(clientsData);
            setAppointments(appointmentsData);
            setFinancials(financialsData);

            // Calculate Metrics
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const appointmentsToday = appointmentsData.filter(app =>
                app.date_time.startsWith(today)
            ).length;

            const incomeMonth = financialsData
                .filter(rec => {
                    const date = new Date(rec.created_at);
                    return rec.type === 'income' &&
                        date.getMonth() === currentMonth &&
                        date.getFullYear() === currentYear;
                })
                .reduce((acc, curr) => acc + curr.amount, 0);

            const newClientsMonth = clientsData.filter(client => {
                const date = new Date(client.created_at);
                return date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear;
            }).length;

            setMetrics({
                appointmentsToday,
                incomeMonth,
                newClientsMonth
            });

        } catch (error) {
            console.error("Erro ao atualizar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <DashboardContext.Provider value={{
            clients,
            appointments,
            financials,
            metrics,
            loading,
            refreshData
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
