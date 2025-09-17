import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SysUser, Expert, ExpertCategory, NewUserAndExpert, AuthenticatedUser } from '../types';
import { api } from '../services/apiService';
import { Button, Input, Select, Modal, Table, Badge, TableColumn } from '../components/common';
import { PlusIcon, EditIcon, TrashIcon, DownloadIcon, UploadIcon, UserGroupIcon, DatabaseIcon } from '../components/icons';

const EMPTY_PERSON: NewUserAndExpert = {
  name: '',
  username: '',
  role: '专家',
  permissions: { isSuperAdmin: false, expertManagement: { view: true, add: false, edit: false, delete: false }, expertSelection: true, selectionResults: true },
  user_status: 1,
  businessScope: '',
  contact_info: '',
  gender: 1,
  birth_date: '',
  category_id: '',
  id_card: '',
  work_unit: '平顶山学院',
  department: '',
  professional_title: '',
  discipline: '',
  bank_card: '',
  in_service_status: 1,
  is_internal: 1,
};

interface ExpertManagementViewProps {
  currentUser: AuthenticatedUser;
}

export const ExpertManagementView: React.FC<ExpertManagementViewProps> = ({ currentUser }) => {
  const [sysUsers, setSysUsers] = useState<SysUser[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [categories, setCategories] = useState<ExpertCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<(NewUserAndExpert & { user_id?: number }) | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [personToDelete, setPersonToDelete] = useState<SysUser | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, expertsData, categoriesData] = await Promise.all([api.getSysUsers(), api.getExperts(), api.getCategories()]);
      setSysUsers(usersData);
      setExperts(expertsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data", error);
      alert('数据加载失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (user: SysUser | null = null) => {
    if (user) {
      const expertData = user.role === '专家' ? experts.find(e => e.user_id === user.user_id) : undefined;
      setEditingPerson({
        ...user,
        ...expertData,
        role: user.role,
        // Ensure required fields are not undefined
        gender: expertData?.gender ?? 1,
        birth_date: expertData?.birth_date ?? '',
        category_id: expertData?.category_id ?? (categories.length > 0 ? categories[0].category_id : ''),
        id_card: expertData?.id_card ?? '',
        work_unit: expertData?.work_unit ?? '平顶山学院',
        department: expertData?.department ?? '',
        professional_title: expertData?.professional_title ?? '',
        discipline: expertData?.discipline ?? '',
        contact_info: expertData?.contact_info ?? '',
        in_service_status: expertData?.in_service_status ?? 1,
        is_internal: expertData?.is_internal ?? 1,
      });
    } else {
      setEditingPerson({ ...EMPTY_PERSON, category_id: categories.length > 0 ? categories[0].category_id : '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPerson(null);
  };

  const handleSaveUser = async () => {
    if (!editingPerson) return;
    try {
      if ('user_id' in editingPerson && editingPerson.user_id) {
        await api.updatePerson(editingPerson.user_id, editingPerson, currentUser);
      } else {
        await api.addPerson(editingPerson, currentUser);
      }
      handleCloseModal();
      loadData();
    } catch (error) {
      alert(`保存失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!personToDelete) return;
    try {
      await api.deletePerson(personToDelete.user_id, currentUser);
      loadData();
      setPersonToDelete(null); 
    } catch (error) {
      alert(`删除失败: ${error instanceof Error ? error.message : String(error)}`);
      setPersonToDelete(null); 
    }
  };
  
  const handleExport = () => {
    const headers = "姓名,登录账号,角色,性别,出生年月,专家类别,身份证号,工作单位及部门,职称,学科,联系方式,银行卡号,在职状态,是否校内\n";
    const csvContent = experts.map(e => {
      const user = sysUsers.find(u => u.user_id === e.user_id);
      const category = categories.find(c => c.category_id === e.category_id);
      return `${e.name},${user?.username || ''},专家,${e.gender === 1 ? '男' : '女'},${e.birth_date || ''},${category?.name || ''},"\t${e.id_card || ''}","${e.work_unit || ''} ${e.department || ''}",${e.professional_title || ''},${e.discipline || ''},${e.contact_info || ''},${e.bank_card || ''},${e.in_service_status === 1 ? '在职' : '离职'},${e.is_internal === 1 ? '是' : '否'}`
    }).join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "专家信息.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
 const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // This function requires significant changes to support the new data model
    alert("批量导入功能正在适配新的数据模型，暂不可用。");
    return;
};


  const admins = useMemo(() => sysUsers.filter(u => u.role === '管理员'), [sysUsers]);
  const expertDetails = useMemo(() => experts.map(expert => {
    const user = sysUsers.find(u => u.user_id === expert.user_id);
    const category = categories.find(c => c.category_id === expert.category_id);
    return {
        ...expert,
        username: user?.username || 'N/A',
        user_status: user?.user_status,
        categoryName: category?.name || '未分类'
    }
  }), [experts, sysUsers, categories]);

  const filterUsers = (userList: SysUser[]) => 
      userList.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const filterExperts = (expertList: typeof expertDetails) =>
      expertList.filter(expert => 
          expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expert.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expert.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expert.username.toLowerCase().includes(searchTerm.toLowerCase())
      )

  const filteredAdmins = useMemo(() => filterUsers(admins), [admins, searchTerm]);
  const filteredExperts = useMemo(() => filterExperts(expertDetails), [expertDetails, searchTerm]);
  
  // FIX: Table component requires an `id` property on data items. Adjusting column type.
  const adminTableColumns: TableColumn<SysUser & { id: number }>[] = [
    { header: '姓名', accessor: 'name' },
    { header: '登录账号', accessor: 'username' },
    { header: '业务范围', accessor: 'businessScope' },
    { header: '状态', accessor: (item) => <Badge color={item.user_status === 1 ? 'green' : 'gray'}>{item.user_status === 1 ? '启用' : '禁用'}</Badge> },
  ];

  // FIX: Table component requires an `id` property on data items. Adjusting column type.
  const expertTableColumns: TableColumn<(typeof expertDetails)[0] & { id: string }>[] = [
    { header: '姓名', accessor: 'name' },
    { header: '部门', accessor: 'department' },
    { header: '专家类别', accessor: 'categoryName' },
    { header: '联系方式', accessor: 'contact_info' },
    { header: '状态', accessor: (item) => <Badge color={item.in_service_status === 1 ? 'green' : 'gray'}>{item.in_service_status === 1 ? '在职' : '离职'}</Badge> },
  ];

  const renderRowActions = (user: SysUser) => {
    const canEdit = currentUser.permissions.expertManagement.edit;
    const canDelete = currentUser.permissions.expertManagement.delete && user.user_id !== currentUser.user_id;

    return (
        <>
            {canEdit && (
                <Button size="sm" variant="ghost" onClick={() => handleOpenModal(user)}><EditIcon className="h-4 w-4" /></Button>
            )}
            {canDelete && (
                <Button size="sm" variant="ghost" onClick={() => setPersonToDelete(user)} className="text-red-600 hover:text-red-700 hover:bg-red-100"><TrashIcon className="h-4 w-4" /></Button>
            )}
        </>
    );
  };
  
  if (isLoading) return <div className="text-center p-8">加载中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">人员管理</h1>
        <div className="flex items-center space-x-2">
            <Input 
                type="text" 
                placeholder="搜索姓名、账号、部门..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-64"
            />
            <Button onClick={handleExport} variant='secondary'>
              <DownloadIcon className="h-4 w-4 mr-2" />
              导出专家
            </Button>
             <Button onClick={() => fileInputRef.current?.click()} variant='secondary'>
              <UploadIcon className="h-4 w-4 mr-2" />
              批量导入(专家)
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
              accept=".csv"
            />
            {currentUser.permissions.expertManagement.add && (
              <Button onClick={() => handleOpenModal()} variant="primary">
                <PlusIcon className="h-4 w-4 mr-2" />
                新增人员
              </Button>
            )}
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><UserGroupIcon className="w-5 h-5 mr-2 text-primary-600"/>管理员列表</h2>
        <Table 
          columns={adminTableColumns}
          // FIX: Table component requires data items to have an `id` property. Mapping `user_id` to `id`.
          data={filteredAdmins.map(user => ({...user, id: user.user_id}))}
          // FIX: The `admin` parameter now includes the `id` property. The logic remains correct.
          renderRowActions={(admin) => renderRowActions(sysUsers.find(u => u.user_id === admin.user_id)!)}
        />
      </div>

      <div>
         <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><DatabaseIcon className="w-5 h-5 mr-2 text-primary-600"/>专家列表</h2>
        <Table 
          columns={expertTableColumns}
          // FIX: Table component requires data items to have an `id` property. Mapping `id_card` to `id`.
          data={filteredExperts.map(expert => ({...expert, id: expert.id_card}))}
          // FIX: The `expert` parameter now includes the `id` property. The logic remains correct.
          renderRowActions={(expert) => renderRowActions(sysUsers.find(u => u.user_id === expert.user_id)!)}
        />
      </div>


      {isModalOpen && editingPerson && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingPerson.user_id ? '编辑人员' : '新增人员'}
          size="2xl"
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
              <Select id="role-select" value={editingPerson.role} onChange={e => setEditingPerson({ ...editingPerson, role: e.target.value as '专家' | '管理员' })}>
                  <option value="专家">专家</option>
                  <option value="管理员">管理员</option>
              </Select>
            </div>

            <fieldset>
              <legend className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">账户信息</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                      <Input id="name-input" placeholder="请输入真实姓名" value={editingPerson.name} onChange={e => setEditingPerson({ ...editingPerson, name: e.target.value })} />
                  </div>
                  <div>
                      <label htmlFor="username-input" className="block text-sm font-medium text-gray-700 mb-1">登录账号 *</label>
                      <Input id="username-input" placeholder="建议使用手机号或工号" value={editingPerson.username} onChange={e => setEditingPerson({ ...editingPerson, username: e.target.value })} />
                  </div>
                  {!editingPerson.user_id && (
                      <div>
                        <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-1">初始密码</label>
                        <Input id="password-input" type="password" placeholder="留空则默认为 123456" onChange={e => setEditingPerson({ ...editingPerson, password: e.target.value })} />
                      </div>
                  )}
              </div>
            </fieldset>
            
            {editingPerson.role === '专家' && (
                <>
                  <fieldset>
                      <legend className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">基本信息</legend>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">联系方式 *</label>
                            <Input placeholder="请输入手机号码" value={editingPerson.contact_info} onChange={e => setEditingPerson({ ...editingPerson, contact_info: e.target.value })} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                              <Select value={editingPerson.gender} onChange={e => setEditingPerson({ ...editingPerson, gender: parseInt(e.target.value) as 1 | 0 })}>
                                  <option value={1}>男</option>
                                  <option value={0}>女</option>
                              </Select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">出生年月</label>
                              <Input type="date" value={editingPerson.birth_date} onChange={e => setEditingPerson({ ...editingPerson, birth_date: e.target.value })} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">身份证号 *</label>
                              <Input placeholder="请输入18位身份证号" value={editingPerson.id_card} onChange={e => setEditingPerson({ ...editingPerson, id_card: e.target.value })} />
                          </div>
                      </div>
                  </fieldset>

                  <fieldset>
                      <legend className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">专业信息</legend>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">专家类别 *</label>
                              <Select value={editingPerson.category_id} onChange={e => setEditingPerson({ ...editingPerson, category_id: e.target.value })}>
                                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                              </Select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">部门 *</label>
                              <Input placeholder="例如：计算机学院" value={editingPerson.department} onChange={e => setEditingPerson({ ...editingPerson, department: e.target.value })} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">学科 *</label>
                              <Input placeholder="例如：软件工程" value={editingPerson.discipline} onChange={e => setEditingPerson({ ...editingPerson, discipline: e.target.value })} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">职称</label>
                              <Input placeholder="例如：教授" value={editingPerson.professional_title} onChange={e => setEditingPerson({ ...editingPerson, professional_title: e.target.value })} />
                          </div>
                          <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">银行卡号</label>
                              <Input placeholder="用于劳务费发放" value={editingPerson.bank_card} onChange={e => setEditingPerson({ ...editingPerson, bank_card: e.target.value })} />
                          </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">在职状态</label>
                              <Select value={editingPerson.in_service_status} onChange={e => setEditingPerson({ ...editingPerson, in_service_status: parseInt(e.target.value) as 1 | 0 })}>
                                  <option value={1}>在职</option>
                                  <option value={0}>离职</option>
                              </Select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">是否校内</label>
                              <Select value={editingPerson.is_internal} onChange={e => setEditingPerson({ ...editingPerson, is_internal: parseInt(e.target.value) as 1 | 0 })}>
                                  <option value={1}>是</option>
                                  <option value={0}>否</option>
                              </Select>
                          </div>
                      </div>
                  </fieldset>
                </>
            )}
            {editingPerson.role === '管理员' && (
                <fieldset>
                  <legend className="text-md font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">管理员信息</legend>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">业务范围</label>
                          <Input placeholder="例如：招标办" value={editingPerson.businessScope} onChange={e => setEditingPerson({ ...editingPerson, businessScope: e.target.value })} />
                      </div>
                       <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">状态</label>
                            <Select value={editingPerson.user_status} onChange={e => setEditingPerson({ ...editingPerson, user_status: parseInt(e.target.value) as 1 | 0 })}>
                                <option value={1}>启用</option>
                                <option value={0}>禁用</option>
                            </Select>
                        </div>
                </fieldset>
            )}
          </div>
          <div className="mt-8 flex justify-end space-x-2 border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={handleCloseModal}>取消</Button>
            <Button variant="primary" onClick={handleSaveUser}>保存</Button>
          </div>
        </Modal>
      )}

      {isImportModalOpen && importResults && (
        <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="批量导入结果">
          <div>
            <p className="text-lg font-semibold text-gray-900">导入完成</p>
            <p className="text-green-600 mt-2">成功导入: {importResults.success} 条</p>
            <p className="text-red-600">失败: {importResults.errors.length} 条</p>
            {importResults.errors.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md border border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-2">错误详情:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {importResults.errors.map((error, index) => (<li key={index}>{error}</li>))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={() => setIsImportModalOpen(false)}>关闭</Button>
          </div>
        </Modal>
      )}

      {personToDelete && (
        <Modal isOpen={!!personToDelete} onClose={() => setPersonToDelete(null)} title="确认删除" size="sm">
          <div>
            <p className="text-gray-700">您确定要删除用户 <strong className="text-gray-900">{personToDelete.name}</strong> 吗?</p>
            <p className="text-sm text-red-600 mt-2">此操作不可恢复。</p>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setPersonToDelete(null)}>取消</Button>
            <Button variant="danger" onClick={handleConfirmDelete}>确认删除</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
