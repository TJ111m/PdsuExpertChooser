

import React, { useState } from 'react';
import { Button, Input, Switch, Textarea } from '../components/common';

// A simple Icon for the warning box
const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

interface SmsSettings {
    smsEnabled: boolean;
    aliyunAccessKeyId: string;
    aliyunAccessKeySecret: string;
    signName: string;
    templateCode: string;
    templateContent: string;
}

export const AdvancedSettingsView: React.FC = () => {
    const [smsSettings, setSmsSettings] = useState<SmsSettings>({
        smsEnabled: false,
        aliyunAccessKeyId: '',
        aliyunAccessKeySecret: '',
        signName: '平顶山学院',
        templateCode: 'SMS_12345678',
        templateContent: '尊敬的{专家姓名}老师，您好！您已被选为“{项目名称}”项目的评审专家。请保持电话畅通，稍后项目经办人（{经办人姓名}，电话：{经办人电话}）将与您联系。谢谢！',
    });

    const handleSmsChange = (field: keyof SmsSettings, value: string | boolean) => {
        setSmsSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveSmsSettings = () => {
        // In a real app, this would save to a backend or secure storage.
        // For this demo, we can log it or maybe save to localStorage.
        console.log("Saving SMS Settings:", smsSettings);
        alert("短信设置已保存！（模拟）");
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">高级设置</h1>

            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-8" role="alert">
                <div className="flex">
                    <div className="py-1"><WarningIcon /></div>
                    <div className="ml-4">
                        <strong className="font-bold">警告!</strong>
                        <span className="block sm:inline ml-2">此页面的设置为高级选项，不正确的配置可能导致系统无法正常工作。请在没有技术人员指导的情况下不要随意修改。</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">后端 API 设置</h2>
                <div className="space-y-4 max-w-lg">
                    <div>
                        <label htmlFor="api-endpoint" className="block text-sm font-medium text-gray-500 mb-1">API Endpoint URL</label>
                        <Input
                            id="api-endpoint"
                            type="text"
                            value="http://116.205.116.243:8080"
                            disabled
                        />
                    </div>
                    <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-500 mb-1">API Key</label>
                        <Input
                            id="api-key"
                            type="password"
                            value="********************"
                            disabled
                        />
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                    <Button variant="primary" disabled>
                        保存设置
                    </Button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                    <h2 className="text-lg font-semibold text-gray-800">短信发送设置 (阿里云)</h2>
                     <Switch 
                        label="启用短信通知" 
                        checked={smsSettings.smsEnabled} 
                        onChange={e => handleSmsChange('smsEnabled', e.target.checked)} 
                    />
                </div>
                 <fieldset disabled={!smsSettings.smsEnabled} className="space-y-4 max-w-lg transition-opacity duration-300 disabled:opacity-50">
                     <div>
                        <label htmlFor="ali-key-id" className="block text-sm font-medium text-gray-500 mb-1">AccessKey ID</label>
                        <Input
                            id="ali-key-id"
                            type="text"
                            placeholder="请输入阿里云 AccessKey ID"
                            value={smsSettings.aliyunAccessKeyId}
                            onChange={e => handleSmsChange('aliyunAccessKeyId', e.target.value)}
                        />
                    </div>
                     <div>
                        <label htmlFor="ali-key-secret" className="block text-sm font-medium text-gray-500 mb-1">AccessKey Secret</label>
                        <Input
                            id="ali-key-secret"
                            type="password"
                            placeholder="请输入阿里云 AccessKey Secret"
                            value={smsSettings.aliyunAccessKeySecret}
                            onChange={e => handleSmsChange('aliyunAccessKeySecret', e.target.value)}
                        />
                    </div>
                     <div>
                        <label htmlFor="ali-sign-name" className="block text-sm font-medium text-gray-500 mb-1">短信签名 (Sign Name)</label>
                        <Input
                            id="ali-sign-name"
                            type="text"
                            placeholder="例如：平顶山学院"
                            value={smsSettings.signName}
                            onChange={e => handleSmsChange('signName', e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="ali-template-code" className="block text-sm font-medium text-gray-500 mb-1">短信模板CODE (Template Code)</label>