import React, { useState, useEffect, useMemo } from 'react';
import { Project, SelectionConfiguration, Expert, ExpertCategory, SelectionRecord, AuthenticatedUser } from '../types';
import { api } from '../services/apiService';
import { Button, Input, Select, Switch, Spinner, Modal, Badge } from '../components/common';
import { PlusIcon, TrashIcon, UserIcon } from '../components/icons';

const EMPTY_PROJECT_INFO: Omit<Project, 'project_id' | 'project_no' | 'project_status' | 'operator_user_id'> = {
  project_name: '', organization_unit: '', extract_date: new Date().toISOString().split('T')[0], supervisor: ''
};

const EMPTY_CONFIG_ROW: Omit<SelectionConfiguration, 'categoryName' | 'avoidExpertIds'> = {
  categoryId: '', count: 1,
};

type ConfigRow = Omit<SelectionConfiguration, 'avoidExpertIds' | 'count'> & {
    count: number | '';
};

const AvoidExpertModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedIds: string[]) => void;
    allExperts: Expert[];
    allCategories: ExpertCategory[];
    initialSelectedIds: string[];
}> = ({ isOpen, onClose, onConfirm, allExperts, allCategories, initialSelectedIds }) => {
    const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(allCategories[0]?.category_id || null);

    const handleToggle = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };
    
    const filteredExperts = useMemo(() => {
        if (!activeCategoryId) return [];
        return allExperts.filter(e => 
            e.category_id === activeCategoryId &&
            (e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (e.department && e.department.toLowerCase().includes(searchTerm.toLowerCase())))
        )
    }, [allExperts, searchTerm, activeCategoryId]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="选择回避专家" size="xl">
            <div className="flex h-[60vh]">
                <div className="w-1/3 border-r border-gray-200 pr-4 overflow-y-auto">
                    <h3 className="font-semibold text-gray-700 mb-2 sticky top-0 bg-white pb-2">专家方向</h3>
                    {allCategories.length > 0 ? (
                        <ul>
                            {allCategories.map(cat => (
                               <li key={cat.category_id} 
                                   onClick={() => setActiveCategoryId(cat.category_id)}
                                   className={`p-2 rounded cursor-pointer transition-colors ${activeCategoryId === cat.category_id ? 'bg-primary-500 text-white font-semibold' : 'text-gray-600 hover:bg-primary-100'}`}
                               >
                                   {cat.name}
                               </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">暂无专家类别，请先在系统管理中添加。</p>
                    )}
                </div>
                <div className="w-2/3 pl-4 flex flex-col">
                    <Input 
                        placeholder="搜索专家姓名或部门..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="mb-4"
                    />
                    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2 bg-gray-50">
                        {filteredExperts.length > 0 ? filteredExperts.map(expert => (
                            <label key={expert.id_card} className="flex items-center p-2 rounded hover:bg-gray-200/50 cursor-pointer">
                                <Switch 
                                    checked={selectedIds.has(expert.id_card)}
                                    onChange={() => handleToggle(expert.id_card)}
                                />
                                <div className="ml-3">
                                    <p className="font-medium text-gray-800">{expert.name}</p>
                                    <p className="text-sm text-gray-500">{expert.department} - {expert.discipline}</p>
                                </div>
                            </label>
                        )) : <div className="text-center text-gray-500 py-8">该类别下无专家或无匹配结果</div>}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2 border-t border-gray-200 pt-4">
                <Button variant="secondary" onClick={onClose}>取消</Button>
                <Button variant="primary" onClick={() => onConfirm(Array.from(selectedIds))}>确认</Button>
            </div>
        </Modal>
    );
};

type View = 'dashboard' | 'experts' | 'selection' | 'results' | 'system' | 'categories' | 'export' | 'advancedSettings';

interface ExpertSelectionViewProps {
    setActiveView: (view: View) => void;
    setLatestSelectionResult: (record: SelectionRecord) => void;
    currentUser: AuthenticatedUser;
}


export const ExpertSelectionView: React.FC<ExpertSelectionViewProps> = ({ setActiveView, setLatestSelectionResult, currentUser }) => {
  const [projectInfo, setProjectInfo] = useState(EMPTY_PROJECT_INFO);
  const [handlerName, setHandlerName] = useState(currentUser.name);
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [avoidExpertIds, setAvoidExpertIds] = useState<string[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [categories, setCategories] = useState<ExpertCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvoidModalOpen, setIsAvoidModalOpen] = useState(false);
  const [isAvoidanceEnabled, setIsAvoidanceEnabled] = useState(true);

  useEffect(() => {
    const loadPrerequisites = async () => {
      const [expertsData, categoriesData] = await Promise.all([api.getExperts(), api.getCategories()]);
      setExperts(expertsData);
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setConfigs([{ ...EMPTY_CONFIG_ROW, categoryId: categoriesData[0].category_id, categoryName: categoriesData[0].name }]);
      }
    };
    loadPrerequisites();
  }, []);
  
  const selectedCategoryIds = useMemo(() => new Set(configs.map(c => c.categoryId)), [configs]);
  const canAddMoreCategories = useMemo(() => configs.length < categories.length, [configs, categories]);

  const handleAddConfigRow = () => {
    const availableCategory = categories.find(c => !selectedCategoryIds.has(c.category_id));
    if (availableCategory) {
      setConfigs([...configs, { 
        ...EMPTY_CONFIG_ROW, 
        categoryId: availableCategory.category_id, 
        categoryName: availableCategory.name 
      }]);
    }
  };

  const handleRemoveConfigRow = (index: number) => {
    setConfigs(configs.filter((_, i) => i !== index));
  };
  
  const handleConfigChange = (index: number, field: keyof ConfigRow, value: string) => {
    const newConfigs = [...configs];
    const configToUpdate = { ...newConfigs[index] };

    if (field === 'categoryId') {
        configToUpdate.categoryId = value;
        configToUpdate.categoryName = categories.find(c => c.category_id === value)?.name || '';
    } else if (field === 'count') {
        if (value === '') {
            configToUpdate.count = '';
        } else {
            const num = parseInt(value, 10);
            if (!isNaN(num)) {
                configToUpdate.count = num;
            }
        }
    }
    
    newConfigs[index] = configToUpdate;
    setConfigs(newConfigs);
  };

  const handleCountBlur = (index: number) => {
    const newConfigs = [...configs];
    const config = newConfigs[index];
    const count = parseInt(String(config.count), 10);
    if (isNaN(count) || count < 1) {
        newConfigs[index] = { ...config, count: 1 };
        setConfigs(newConfigs);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectInfo.project_name || !handlerName) {
        alert("请填写所有必填项: 项目名称和经办人。");
        return;
    }
    setIsLoading(true);

    const validatedConfigs = configs.map(c => ({
        ...c,
        count: Number(c.count) || 1,
    }));
    
    try {
        const finalAvoidIds = isAvoidanceEnabled ? avoidExpertIds : [];
        const configsForApi: SelectionConfiguration[] = validatedConfigs.map(c => ({...c, avoidExpertIds: finalAvoidIds}));
        
        const projectForApi = {
            ...projectInfo,
            operator_user_id: currentUser.user_id, // Using current user's ID
        };
        
        const result = await api.createProjectAndSelectExperts(projectForApi, configsForApi, currentUser);
        setLatestSelectionResult(result);

        setProjectInfo(EMPTY_PROJECT_INFO);
        setAvoidExpertIds([]);
        if (categories.length > 0) {
            setConfigs([{...EMPTY_CONFIG_ROW, categoryId: categories[0].category_id, categoryName: categories[0].name}]);
        } else {
            setConfigs([]);
        }
        setActiveView('results');
    } catch (error) {
        alert(`抽取失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  const avoidedExperts = useMemo(() => experts.filter(e => avoidExpertIds.includes(e.id_card)), [experts, avoidExpertIds]);

  return (
    <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">专家抽取</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">1. 项目信息</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="*项目名称" value={projectInfo.project_name} onChange={e => setProjectInfo({...projectInfo, project_name: e.target.value})} required />
                    <Input placeholder="组织单位" value={projectInfo.organization_unit} onChange={e => setProjectInfo({...projectInfo, organization_unit: e.target.value})} />
                    <Input type="date" value={projectInfo.extract_date} onChange={e => setProjectInfo({...projectInfo, extract_date: e.target.value})} />
                    <Input placeholder="*经办人" value={handlerName} onChange={e => setHandlerName(e.target.value)} required />
                    <Input placeholder="监督人" value={projectInfo.supervisor} onChange={e => setProjectInfo({...projectInfo, supervisor: e.target.value})} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                    <h2 className="text-lg font-semibold text-gray-800">2. 回避专家设置</h2>
                    <Switch label="启用回避" checked={isAvoidanceEnabled} onChange={(e) => setIsAvoidanceEnabled(e.target.checked)} />
                </div>
                <div className={`transition-opacity duration-300 ${!isAvoidanceEnabled ? 'opacity-50' : ''}`}>
                    <div className={`space-y-4 ${!isAvoidanceEnabled ? 'pointer-events-none' : ''}`}>
                        <div className="mb-4">
                            <Button type="button" variant="secondary" onClick={() => setIsAvoidModalOpen(true)}>
                                <UserIcon className="h-4 w-4 mr-2" />
                                选择回避专家
                            </Button>
                        </div>
                        {avoidedExperts.length > 0 && (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                                <h3 className="font-semibold text-sm text-gray-500 mb-2">已选择回避 {avoidedExperts.length} 位专家:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {avoidedExperts.map(expert => (
                                        <Badge key={expert.id_card} color="yellow">{expert.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">3. 抽取配置</h2>
                <div className="space-y-4">
                    {configs.map((config, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                           <div className="md:col-span-2">
                             <label className="text-sm font-medium text-gray-500 block mb-1">专家方向</label>
                             <Select value={config.categoryId} onChange={e => handleConfigChange(index, 'categoryId', e.target.value)}>
                                 {categories
                                    .filter(c => !selectedCategoryIds.has(c.category_id) || c.category_id === config.categoryId)
                                    .map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                             </Select>
                           </div>
                           <div>
                             <label className="text-sm font-medium text-gray-500 block mb-1">抽取数量</label>
                             <Input 
                                type="number" 
                                placeholder="需抽数量" 
                                min="1" 
                                value={config.count} 
                                onChange={e => handleConfigChange(index, 'count', e.target.value)} 
                                onBlur={() => handleCountBlur(index)}
                              />
                           </div>
                           <div className="flex items-end justify-end h-full">
                             {configs.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveConfigRow(index)} className="text-red-500 hover:bg-red-100"><TrashIcon className="h-4 w-4" /></Button>}
                           </div>
                        </div>
                    ))}
                </div>
                <Button 
                    type="button" 
                    onClick={handleAddConfigRow} 
                    className="mt-4" 
                    variant="secondary" 
                    size="sm"
                    disabled={!canAddMoreCategories}
                >
                  <PlusIcon className="h-4 w-4 mr-2"/> 添加类别
                </Button>
            </div>
            
            <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
                    {isLoading ? <Spinner /> : '开始抽取'}
                </Button>
            </div>
        </form>

        {isAvoidModalOpen && (
            <AvoidExpertModal
                isOpen={isAvoidModalOpen}
                onClose={() => setIsAvoidModalOpen(false)}
                onConfirm={(ids) => {
                    setAvoidExpertIds(ids);
                    setIsAvoidModalOpen(false);
                }}
                allExperts={experts}
                allCategories={categories}
                initialSelectedIds={avoidExpertIds}
            />
        )}
    </div>
  );
};
