import React from 'react';
import { api } from '../services/apiService';
import { Button } from '../components/common';
import { DownloadIcon } from '../components/icons';

export const DataExportView = () => {

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for BOM
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportUsers = async () => {
        const users = await api.getSysUsers();
        const headers = "姓名,登录账号,角色,业务范围,状态\n";
        const csvContent = users.map(u => 
            `${u.name},${u.username},${u.role},${u.businessScope || ''},${u.user_status === 1 ? '启用' : '禁用'}`
        ).join("\n");
        downloadCSV(headers + csvContent, '所有人员列表.csv');
    };

    const handleExportExperts = async () => {
        const experts = await api.getExperts();
        const categories = await api.getCategories();
        const categoryMap = new Map(categories.map(c => [c.category_id, c.name]));
        const headers = "姓名,性别,出生年月,专家类别,身份证号,工作单位及部门,职称,学科,联系方式,银行卡号,在职状态,是否校内\n";
        const csvContent = experts.map(e => 
            `${e.name},${e.gender === 1 ? '男' : '女'},${e.birth_date},${categoryMap.get(e.category_id) || ''},"\t${e.id_card}","${e.work_unit} ${e.department}",${e.professional_title || ''},${e.discipline},${e.contact_info},${e.bank_card || ''},${e.in_service_status === 1 ? '在职' : '离职'},${e.is_internal === 1 ? '是' : '否'}`
        ).join("\n");
        downloadCSV(headers + csvContent, '专家列表.csv');
    };

    const handleExportProjects = async () => {
        const records = await api.getSelectionRecords();
        const users = await api.getSysUsers();
        // FIX: Fetch experts once to avoid sync calls inside map
        const experts = await api.getExperts();
        const userMap = new Map(users.map(u => [u.user_id, u.name]));
        const expertMap = new Map(experts.map(e => [e.id_card, e]));

        const headers = "项目名称,项目编号,组织单位,抽取日期,经办人,监督人,状态,专家列表\n";
        const csvContent = records.map(r => {
            // FIX: Use expertMap for synchronous lookup
            const expertNames = r.finalExperts.map(({expertIdCard}) => expertMap.get(expertIdCard)?.name || '未知').join('; ');
            return `${r.project.project_name},${r.project.project_no},${r.project.organization_unit},${r.project.extract_date},${userMap.get(r.project.operator_user_id) || ''},${r.project.supervisor},${r.status},"${expertNames}"`;
        }).join("\n");
        downloadCSV(headers + csvContent, '项目列表.csv');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">数据导出</h1>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <p className="text-gray-500 mb-6">导出系统中的关键数据为 CSV 文件，便于备份和线下分析。</p>
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-gray-800">导出所有人员列表</h3>
                            <p className="text-sm text-gray-500">将系统中所有用户（包括管理员和专家）的信息导出为 CSV 文件。</p>
                        </div>
                        <Button variant="secondary" onClick={handleExportUsers}>
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            导出所有人员
                        </Button>
                    </div>
                     <div className="p-4 bg-gray-50 border border-gray-200 rounded-md flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-gray-800">仅导出专家列表</h3>
                            <p className="text-sm text-gray-500">将系统中所有角为“专家”的人员详细信息导出为 CSV 文件。</p>
                        </div>
                        <Button variant="secondary" onClick={handleExportExperts}>
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            导出专家
                        </Button>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-gray-800">导出项目列表</h3>
                            <p className="text-sm text-gray-500">将所有抽取项目的详细信息及最终专家名单导出为 CSV 文件。</p>
                        </div>
                        <Button variant="secondary" onClick={handleExportProjects}>
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            导出项目
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};