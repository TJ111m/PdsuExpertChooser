import React, { useState, useEffect, useCallback } from 'react';
import { ExpertCategory, AuthenticatedUser } from '../types';
import { api } from '../services/apiService';
import { Button, Modal, Table, Input, TableColumn } from '../components/common';
import { PlusIcon, EditIcon, TrashIcon } from '../components/icons';

interface CategoryManagementViewProps {
    currentUser: AuthenticatedUser;
}

export const CategoryManagementView: React.FC<CategoryManagementViewProps> = ({ currentUser }) => {
    return (
        <div>
            <CategoryManagement currentUser={currentUser}/>
        </div>
    );
}

const CategoryManagement: React.FC<CategoryManagementViewProps> = ({ currentUser }) => {
    const [categories, setCategories] = useState<ExpertCategory[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ExpertCategory | {name: string} | null>(null);

    const loadCategories = useCallback(async () => {
        const categoriesData = await api.getCategories();
        setCategories(categoriesData);
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);
    
    const handleSave = async () => {
        if (!editingCategory) return;
        try {
            if ('category_id' in editingCategory) {
                await api.updateCategory(editingCategory, currentUser);
            } else {
                await api.addCategory(editingCategory.name, currentUser);
            }
            setIsModalOpen(false);
            loadCategories();
        } catch (error) {
            alert(`保存失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (window.confirm('确定删除该类别吗？')) {
            try {
                await api.deleteCategory(id, currentUser);
                loadCategories();
            } catch (error) {
                alert(`删除失败: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    };

    // FIX: Table component requires an `id` property on data items. Adjusting column type.
    const columns: TableColumn<ExpertCategory & {id: string}>[] = [{ header: '类别名称', accessor: 'name' }];
    
    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">专家类别管理</h1>
                <Button variant="primary" onClick={() => { setEditingCategory({name: ''}); setIsModalOpen(true); }}>
                    <PlusIcon className="h-4 w-4 mr-2" />新增类别
                </Button>
            </div>
            <Table
                columns={columns}
                // FIX: Table component requires data items to have an `id` property. Mapping `category_id` to `id`.
                data={categories.map(c => ({...c, id: c.category_id}))}
                // FIX: The `cat` parameter now includes the `id` property. The logic remains correct.
                renderRowActions={(cat) => (
                    <>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}><EditIcon className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-100" onClick={() => handleDelete(cat.category_id)}><TrashIcon className="h-4 w-4" /></Button>
                    </>
                )}
            />
            {isModalOpen && editingCategory && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={'category_id' in editingCategory ? '编辑类别' : '新增类别'}>
                    <Input 
                        placeholder="类别名称" 
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    />
                    <div className="mt-4 flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                        <Button variant="primary" onClick={handleSave}>保存</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};
