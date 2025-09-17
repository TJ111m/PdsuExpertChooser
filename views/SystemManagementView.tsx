import React, { useState, useEffect, useMemo } from 'react';
import { SysLog, SysUser } from '../types';
import { api } from '../services/apiService';
import { Table, TableColumn, Input, Select } from '../components/common';

export const SystemManagementView: React.FC = () => {
    const [logs, setLogs] = useState<SysLog[]>([]);
    const [users, setUsers] = useState<SysUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

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

    // Derive unique options for filters
    const uniqueModules = useMemo(() => [...new Set(logs.map(log => log.operation_module))], [logs]);
    const uniqueTypes = useMemo(() => [...new Set(logs.map(log => log.operation_type))], [logs]);
    
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const userName = userMap.get(log.user_id) || '';
            const lowerCaseSearch = searchTerm.toLowerCase();

            const matchesSearch = searchTerm === '' || 
                                  userName.toLowerCase().includes(lowerCaseSearch) || 
                                  log.operation_content.toLowerCase().includes(lowerCaseSearch);
            
            const matchesModule = moduleFilter === '' || log.operation_module === moduleFilter;
            const matchesType = typeFilter === '' || log.operation_type === typeFilter;

            return matchesSearch && matchesModule && matchesType;
        });
    }, [logs, searchTerm, moduleFilter, typeFilter, userMap]);
    
    // FIX: Table component requires an `id` property on data items. Adjusting column type.
    const logTableColumns: TableColumn<SysLog & { id: number }>[] = [
        { header: '时间', accessor: (log) => new Date(log.operation_time).toLocaleString() },
        { header: '用户', accessor: (log) => userMap.get(log.user_id) || `ID: ${log.user_id}` },
        { header: '操作模块', accessor: 'operation_module' },
        { header: '操作类型', accessor: 'operation_type' },
        { header: '详情', accessor: 'operation_content', className: 'w-1/3' },
    ];

    if(isLoading) {
        return <div className="p-4 text-center">加载日志中...</div>
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">系统日志</h1>
                <div className="flex items-center space-x-2">
                    <Select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="w-40">
                        <option value="">所有模块</option>
                        {uniqueModules.map(mod => <option key={mod} value={mod}>{mod}</option>)}
                    </Select>
                    <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-40">
                        <option value="">所有类型</option>
                        {uniqueTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </Select>
                    <Input 
                        type="text" 
                        placeholder="搜索用户或详情..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-64"
                    />
                </div>
            </div>
            
            {/* FIX: Table component requires data items to have an `id` property. Mapping `log_id` to `id`. */}
            <Table columns={logTableColumns} data={filteredLogs.map(log => ({ ...log, id: log.log_id }))} />
        </div>
    );
};