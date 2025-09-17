import React, { useState, useEffect, useMemo } from 'react';
import { SysLog, SysUser } from '../types';
import { api } from '../services/apiService';
import { Table, TableColumn } from '../components/common';

export const SystemManagementView: React.FC = () => {
    const [logs, setLogs] = useState<SysLog[]>([]);
    const [users, setUsers] = useState<SysUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [logsData, usersData] = await Promise.all([api.getSystemLogs(), api.getSysUsers()]);
                setLogs(logsData);
                setUsers(usersData);
            } catch (error) {
                console.error("Failed to load system management data:", error);
                alert("无法加载系统日志或用户信息。");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const userMap = useMemo(() => {
        return new Map(users.map(user => [user.user_id, user.name]));
    }, [users]);
    
    // FIX: Table component requires an `id` property on data items. Adjusting column type.
    const logTableColumns: TableColumn<SysLog & { id: number }>[] = [
        { header: '时间', accessor: (log) => new Date(log.operation_time).toLocaleString() },
        { header: '用户', accessor: (log) => userMap.get(log.user_id) || `ID: ${log.user_id}` },
        { header: '操作模块', accessor: 'operation_module' },
        { header: '操作类型', accessor: 'operation_type' },
        { header: '详情', accessor: 'operation_content', className: 'w-1/3' },
    ];

    if(isLoading) {
        return <div>加载日志中...</div>
    }
    
    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">系统日志</h1>
            {/* FIX: Table component requires data items to have an `id` property. Mapping `log_id` to `id`. */}
            <Table columns={logTableColumns} data={logs.map(log => ({ ...log, id: log.log_id }))} />
        </div>
    );
};
