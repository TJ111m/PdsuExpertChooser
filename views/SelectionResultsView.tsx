import React, { useState, useEffect, useMemo } from 'react';
import { SelectionRecord, AuthenticatedUser, Expert } from '../types';
import { api } from '../services/apiService';
import { Button, Input, Modal, Table, Badge, TableColumn } from '../components/common';

interface SelectionResultsViewProps {
    currentUser: AuthenticatedUser;
    latestSelectionResult: SelectionRecord | null;
    setLatestSelectionResult: (record: SelectionRecord | null) => void;
}

export const SelectionResultsView: React.FC<SelectionResultsViewProps> = ({ currentUser, latestSelectionResult, setLatestSelectionResult }) => {
    const [records, setRecords] = useState<SelectionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<SelectionRecord | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
    const [expertToReplace, setExpertToReplace] = useState<Expert | null>(null);
    const [replaceReason, setReplaceReason] = useState('');
    const [allUsers, setAllUsers] = useState<AuthenticatedUser[]>([]);
    // FIX: Add state to hold all experts for synchronous lookup.
    const [allExperts, setAllExperts] = useState<Expert[]>([]);

    const [resultToShowInModal, setResultToShowInModal] = useState<SelectionRecord | null>(null);

    useEffect(() => {
        if (latestSelectionResult) {
            setResultToShowInModal(latestSelectionResult);
        }
    }, [latestSelectionResult]);

    const handleCloseResultModal = () => {
        setResultToShowInModal(null);
        setLatestSelectionResult(null);
    };

    const loadData = async () => {
        setIsLoading(true);
        try {
            // FIX: Fetch all experts along with other data.
            const [data, usersData, expertsData] = await Promise.all([api.getSelectionRecords(), api.getSysUsers(), api.getExperts()]);
            setRecords(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setAllUsers(usersData);
            setAllExperts(expertsData);
        } catch (error) {
            alert('获取抽取记录失败');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleViewDetails = (record: SelectionRecord) => {
        setSelectedRecord(record);
        setIsDetailsModalOpen(true);
    };

    const handleOpenReplaceModal = async (record: SelectionRecord, expertIdCard: string) => {
        const expert = await api.getExpertByIdCard(expertIdCard);
        if (expert) {
            setSelectedRecord(record);
            setExpertToReplace(expert);
            setIsReplaceModalOpen(true);
        } else {
            alert("无法找到专家信息。")
        }
    };

    const handleReplaceExpert = async () => {
        if (!selectedRecord || !expertToReplace || !replaceReason) {
            alert('请提供完整信息');
            return;
        }
        try {
            await api.replaceExpert(selectedRecord.id, expertToReplace.id_card, replaceReason, currentUser);
            alert('补抽成功');
            setIsReplaceModalOpen(false);
            setExpertToReplace(null);
            setReplaceReason('');
            setIsDetailsModalOpen(false); // Close details modal as well to refresh data
            loadData();
        } catch (error) {
            alert(`补抽失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const getHandlerName = (userId: number) => allUsers.find(u => u.user_id === userId)?.name || '未知';

    // FIX: Create a memoized map for quick, synchronous expert lookup.
    const expertMap = useMemo(() => {
        return new Map(allExperts.map(expert => [expert.id_card, expert]));
    }, [allExperts]);

    const filteredRecords = useMemo(() => {
        const textFiltered = records.filter(record =>
            record.project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.project.project_no.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (currentUser.permissions.isSuperAdmin) {
            return textFiltered;
        }

        return textFiltered.filter(record => record.project.operator_user_id === currentUser.user_id);
    }, [records, searchTerm, currentUser]);

    const tableColumns: TableColumn<SelectionRecord>[] = [
        { header: '项目名称', accessor: (r: SelectionRecord) => r.project.project_name },
        { header: '项目编号', accessor: (r: SelectionRecord) => r.project.project_no },
        { header: '抽取日期', accessor: (r: SelectionRecord) => new Date(r.timestamp).toLocaleDateString() },
        { header: '经办人', accessor: (r: SelectionRecord) => getHandlerName(r.project.operator_user_id) },
        { header: '状态', accessor: (r: SelectionRecord) => <Badge color={r.status === '有补抽' ? 'yellow' : 'green'}>{r.status}</Badge> },
    ];
    
    // Memoize the final experts details to avoid re-fetching on every render
    const FinalExpertsDetails = React.memo(({ expertIdCard, categoryName, onReplaceClick }: { expertIdCard: string, categoryName: string, onReplaceClick: () => void }) => {
        const [expert, setExpert] = useState<Expert | null>(null);

        useEffect(() => {
            const fetchExpert = async () => {
                const expertData = await api.getExpertByIdCard(expertIdCard);
                if (expertData) {
                    setExpert(expertData);
                }
            };
            fetchExpert();
        }, [expertIdCard]);

        if (!expert) return <li className="py-2">加载专家信息...</li>;

        return (
            <li className="py-2 flex justify-between items-center">
                <div>
                    <span className="font-medium text-gray-800">{expert.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({categoryName}, {expert.work_unit})</span>
                </div>
                <Button size="sm" variant="secondary" onClick={onReplaceClick}>补抽替换</Button>
            </li>
        );
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">项目信息</h1>
                <Input type="text" placeholder="搜索项目名称/编号..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-64" />
            </div>
            <Table
                columns={tableColumns}
                data={filteredRecords}
                renderRowActions={(record) => (
                    <Button size="sm" onClick={() => handleViewDetails(record)}>详情</Button>
                )}
            />

            {isDetailsModalOpen && selectedRecord && (
                <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="抽取详情" size="xl">
                    <div className="space-y-4">
                        <h4 className="font-semibold">最终专家名单</h4>
                        <ul className="divide-y divide-gray-200">
                           {selectedRecord.finalExperts.map(({ expertIdCard, categoryName }) => (
                               <FinalExpertsDetails 
                                   key={expertIdCard}
                                   expertIdCard={expertIdCard}
                                   categoryName={categoryName}
                                   onReplaceClick={() => handleOpenReplaceModal(selectedRecord, expertIdCard)}
                               />
                           ))}
                        </ul>
                         <h4 className="font-semibold mt-4">抽取日志</h4>
                         <div className="max-h-60 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200">
                            {selectedRecord.log.map((logEntry, index) => (
                                <p key={index} className="text-sm text-gray-600 mb-1 font-mono">
                                    [{new Date(logEntry.timestamp).toLocaleString()}] {logEntry.type === 'replacement' ? `[补抽] ${logEntry.replacedExpertName} 因 "${logEntry.reason}" 被 ${logEntry.newExpertName} 替换` : `[初始] 抽中专家 ${logEntry.newExpertName} (${logEntry.message})`}
                                </p>
                            ))}
                         </div>
                    </div>
                </Modal>
            )}

            {isReplaceModalOpen && selectedRecord && expertToReplace && (
                <Modal isOpen={isReplaceModalOpen} onClose={() => setIsReplaceModalOpen(false)} title="补抽专家">
                    <p className="mb-4">正在为专家 <span className="font-semibold text-gray-900">{expertToReplace.name}</span> 进行补抽替换。</p>
                    <Input 
                        placeholder="*请输入替换理由 (如请假、回避等)" 
                        value={replaceReason}
                        onChange={e => setReplaceReason(e.target.value)}
                    />
                    <div className="mt-4 flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsReplaceModalOpen(false)}>取消</Button>
                        <Button variant="primary" onClick={handleReplaceExpert}>确认补抽</Button>
                    </div>
                </Modal>
            )}

            {resultToShowInModal && (
                <Modal isOpen={true} onClose={handleCloseResultModal} title="抽取成功" size="lg">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-primary-600">{resultToShowInModal.project.project_name}</h3>
                            <p className="text-sm text-gray-500">{resultToShowInModal.project.project_no}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-700">专家名单:</h4>
                            <ul className="divide-y divide-gray-200 mt-2">
                                {resultToShowInModal.finalExperts.map(({ expertIdCard, categoryName }) => {
                                    // FIX: Use the expertMap for synchronous lookup instead of an async call in render.
                                    const expert = expertMap.get(expertIdCard);
                                    return expert ? (
                                        <li key={expert.id_card} className="py-2 flex justify-between items-center">
                                            <div>
                                                <span className="font-medium text-gray-800">{expert.name}</span>
                                                <span className="text-sm text-gray-500 ml-2">({expert.department})</span>
                                            </div>
                                            <Badge color="blue">{categoryName}</Badge>
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button variant="primary" onClick={handleCloseResultModal}>
                                确认
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};