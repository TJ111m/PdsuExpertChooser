// services/realApi.ts

import { AuthenticatedUser, Expert, ExpertCategory, NewUserAndExpert, Project, SelectionConfiguration, SelectionRecord, SysLog, SysUser, RemoteSysUser, RemoteExpert, RemoteProject, RemoteLog, SelectionLogEntry } from '../types';
import { IApiService } from './apiService';

const API_ORIGIN = 'http://116.205.116.243:8080';


// --- API Data Structures ---
interface ApiResponse<T> {
    code: number;
    msg: string;
    data: T;
}

class RealApiService implements IApiService {
    private token: string | null = null;

    // --- Core Request Functions (WordPress API Style with Auth Token) ---

    private async _fetchWithAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
        const targetUrl = `${API_ORIGIN}${path}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Similar to WordPress using Application Passwords or JWT, we add an Authorization header.
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(targetUrl, { ...options, headers });

            if (!response.ok) {
                // Attempt to get more info from body for error
                const errorBody = await response.text();
                console.error("API Error Body:", errorBody);
                throw new Error(`网络请求失败: ${response.status} ${response.statusText}`);
            }

            // Handle successful but empty responses (e.g., from DELETE)
            if (response.status === 204) {
                return null as T;
            }

            const responseText = await response.text();
            // Handle cases where response is empty text
            if (!responseText) {
                return null as T;
            }

            const apiResponse: ApiResponse<T> | T = JSON.parse(responseText);

            if (apiResponse && typeof apiResponse === 'object' && 'data' in apiResponse && 'code' in apiResponse) {
                const wrappedResponse = apiResponse as ApiResponse<T>;
                // The API uses both 200 and 0 for success codes.
                if (wrappedResponse.code === 200 || wrappedResponse.code === 0) {
                    return wrappedResponse.data;
                } else {
                    throw new Error(`API 返回错误 ${wrappedResponse.code}: ${wrappedResponse.msg}`);
                }
            }

            console.warn(`API 响应 (${path}) 未使用标准格式包装，将直接返回。`);
            return apiResponse as T;

        } catch (error) {
            console.error(`[RealApiService] Request failed for ${path}.`, error);
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                throw new Error('网络请求失败。请检查您的网络连接以及是否能访问后端服务器。');
            }
            throw error;
        }
    }

    private getRequest<T>(path: string): Promise<T> {
        return this._fetchWithAuth(path, { method: 'GET' });
    }

    private postRequest<T>(path: string, body: object): Promise<T> {
        return this._fetchWithAuth(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    private deleteRequest<T>(path: string): Promise<T> {
        return this._fetchWithAuth(path, { method: 'DELETE' });
    }

    // --- Mappers ---
    private mapRemoteUserToSysUser(remoteUser: RemoteSysUser): SysUser {
        const isSuperAdmin = remoteUser.username === 'admin';
        return {
            user_id: remoteUser.userId,
            username: remoteUser.username,
            name: remoteUser.username, // API does not provide 'name', using username as fallback.
            passwordHash: remoteUser.password || '',
            user_status: 1, // API does not provide status, defaulting to enabled.
            role: isSuperAdmin ? '管理员' : '专家', // Simple logic, might need refinement.
            permissions: {
                isSuperAdmin,
                expertManagement: { view: true, add: isSuperAdmin, edit: isSuperAdmin, delete: isSuperAdmin },
                expertSelection: true,
                selectionResults: true,
            },
            businessScope: isSuperAdmin ? '全校' : '',
        };
    }

    private mapRemoteExpertToExpert(remoteExpert: RemoteExpert): Expert {
        return {
            id_card: remoteExpert.idCard,
            name: remoteExpert.name,
            gender: remoteExpert.gender === '男' ? 1 : 0,
            birth_date: remoteExpert.birthDate,
            contact_info: remoteExpert.phone,
            discipline: remoteExpert.major,
            professional_title: remoteExpert.title,
            // --- Fields not present in remote API, using defaults ---
            user_id: null, // This needs to be associated after fetching users
            category_id: 'cat001', // Default category as API doesn't support it
            work_unit: '平顶山学院',
            department: '未知', // Default department
            bank_card: undefined,
            in_service_status: 1,
            is_internal: 1,
        };
    }

    private mapRemoteLogToSysLog(remoteLog: RemoteLog): SysLog {
        return {
            log_id: remoteLog.logId || Date.now(),
            user_id: remoteLog.userId,
            operation_module: remoteLog.operation,
            operation_type: remoteLog.method,
            operation_content: remoteLog.params,
            operation_time: remoteLog.createTime,
            ip_address: remoteLog.ip,
            operation_result: 1, // Assuming all logged operations are successful
            remark: `用户: ${remoteLog.username}`,
        };
    }

    private mapRemoteProjectToProject(remote: RemoteProject): Project {
        return {
            project_id: remote.projectId!,
            project_name: remote.projectName,
            project_no: remote.projectNo,
            organization_unit: remote.description, // Best fit
            extract_date: remote.startDate,
            operator_user_id: 0, // Not available from this endpoint
            supervisor: '',      // Not available
            project_status: 2,   // Assuming '已完成'
        };
    }

    // --- API Methods ---

    async addLog(user_id: number, username: string, operation_module: string, operation_type: string, operation_content: string): Promise<void> {
        const remoteLog = {
            userId: user_id,
            username: username,
            operation: operation_module,
            method: operation_type,
            params: operation_content,
            ip: '127.0.0.1', // Cannot get real IP from frontend
        };
        try {
            await this.postRequest('/log/add', remoteLog);
        } catch (error) {
            console.error("Failed to write log to backend", error);
            // Don't throw, logging failure should not break user flow
        }
    }

    async login(username: string, password: string): Promise<AuthenticatedUser | null> {
        // The backend lacks a proper POST /login endpoint.
        // We will keep the existing logic but simulate token generation and storage,
        // which mimics the pattern of modern APIs like WordPress with JWT or App Passwords.
        const allRemoteUsers = await this.getRequest<RemoteSysUser[]>('/sys_user/list');
        if (Array.isArray(allRemoteUsers)) {
            const remoteUser = allRemoteUsers.find(u => u.username === username);
            // NOTE: The API does not have a real login endpoint with password check. This is insecure.
            if (remoteUser) {
                // Simulate creating and storing a token upon successful login.
                // In a real scenario, the token would be returned by the server from a POST /login request.
                this.token = btoa(`${username}:${password}`); // Example token, mimics Basic Auth

                const user = this.mapRemoteUserToSysUser(remoteUser);
                await this.addLog(user.user_id, user.username, '登录模块', '用户登录', `用户 ${user.name} 登录成功`);
                return user;
            }
        }
        return null;
    }

    async getStats() {
        const [experts, users, projects] = await Promise.all([this.getExperts(), this.getSysUsers(), this.getSelectionRecords()]);
        return {
            expertCount: experts.length,
            userCount: users.length,
            selectionCount: projects.length,
            categoryCount: 1 // Remote API doesn't support categories
        };
    }

    async getSysUsers(): Promise<SysUser[]> {
        const remoteData = await this.getRequest<RemoteSysUser[]>('/sys_user/list');
        return Array.isArray(remoteData) ? remoteData.map(this.mapRemoteUserToSysUser) : [];
    }

    async getExperts(): Promise<Expert[]> {
        const remoteData = await this.getRequest<RemoteExpert[]>('/expert/list');
        if (Array.isArray(remoteData)) {
            const users = await this.getSysUsers();
            const userMap = new Map(users.map(u => [u.username, u.user_id]));
            return remoteData.map(remoteExpert => {
                const expert = this.mapRemoteExpertToExpert(remoteExpert);
                const userId = userMap.get(expert.name);
                if (userId) expert.user_id = userId;
                return expert;
            });
        }
        return [];
    }

    async addPerson(person: NewUserAndExpert, actor: AuthenticatedUser): Promise<void> {
        const remoteUser = {
            username: person.username,
            password: person.password || '123456',
            email: `${person.username}@example.com`, // API requires a value
        };
        await this.postRequest('/sys_user/add', remoteUser);

        if (person.role === '专家') {
            const remoteExpert = {
                idCard: person.id_card!,
                name: person.name,
                gender: person.gender === 1 ? '男' : '女',
                birthDate: person.birth_date!,
                phone: person.contact_info!,
                email: `${person.contact_info}@example.com`,
                major: person.discipline!,
                degree: '未知', // Not in form, use default
                title: person.professional_title!,
            };
            await this.postRequest('/expert/add', remoteExpert);
        }

        await this.addLog(actor.user_id, actor.username, '人员管理', '新增', `新增 ${person.role}: ${person.name}`);
    }

    async deletePerson(userId: number, actor: AuthenticatedUser): Promise<void> {
        const userToDelete = await this.getSysUserById(userId);
        if (!userToDelete) throw new Error("未找到要删除的用户。");

        if (userToDelete.role === '专家') {
            const experts = await this.getExperts();
            const expertData = experts.find(e => e.user_id === userId);
            // The API uses idCard for deletion, not userId
            if (!expertData) throw new Error(`无法找到用户ID ${userId} 对应的专家身份证号来进行删除。`);
            // Using DELETE method, which is RESTful standard like WordPress API.
            await this.deleteRequest(`/expert/deleteById/${expertData.id_card}`);
        }

        // Also delete from user table, using the proper DELETE verb.
        await this.deleteRequest(`/sys_user/deleteById/${userId}`);

        await this.addLog(actor.user_id, actor.username, '人员管理', '删除', `删除 ${userToDelete.role}: ${userToDelete.name}`);
    }

    async getSystemLogs(): Promise<SysLog[]> {
        const remoteData = await this.getRequest<RemoteLog[]>('/log/list');
        return Array.isArray(remoteData) ? remoteData.map(this.mapRemoteLogToSysLog) : [];
    }

    async getSelectionRecords(): Promise<SelectionRecord[]> {
        const remoteProjects = await this.getRequest<RemoteProject[]>('/project/list');
        if (!Array.isArray(remoteProjects)) return [];
        return remoteProjects.map(p => ({
            id: p.projectId!.toString(),
            project: this.mapRemoteProjectToProject(p),
            finalExperts: [], // Data not available from backend API
            log: [],          // Data not available from backend API
            status: '正常抽取',
            timestamp: p.startDate,
        }));
    }

    async createProjectAndSelectExperts(
        projectInfo: Omit<Project, 'project_id' | 'project_no' | 'project_status'>,
        configs: SelectionConfiguration[],
        actor: AuthenticatedUser
    ): Promise<SelectionRecord> {

        const allExperts = await this.getExperts();
        const allCategories = await this.getCategories();
        const finalExperts: { expertIdCard: string; categoryName: string }[] = [];
        const log: SelectionLogEntry[] = [];

        for (const config of configs) {
            const categoryName = allCategories.find(c => c.category_id === config.categoryId)?.name || '未知';
            let pool = allExperts.filter(e =>
                e.category_id === config.categoryId &&
                e.in_service_status === 1 &&
                !config.avoidExpertIds.includes(e.id_card)
            );

            if (pool.length < config.count) {
                throw new Error(`类别 "${categoryName}" 的可用专家数量 (${pool.length}) 不足, 需要 ${config.count} 位。`);
            }

            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            const selected = pool.slice(0, config.count);
            selected.forEach(expert => {
                finalExperts.push({ expertIdCard: expert.id_card, categoryName: categoryName });
                log.push({
                    timestamp: new Date().toISOString(), type: 'initial',
                    message: `从类别 "${categoryName}" 中成功抽取专家`, newExpertName: expert.name,
                });
            });
        }

        const remoteProject: Omit<RemoteProject, 'projectId'> = {
            projectNo: `PDSU-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
            projectName: projectInfo.project_name,
            description: `组织单位: ${projectInfo.organization_unit || '无'}. 监督人: ${projectInfo.supervisor || '无'}.`,
            startDate: projectInfo.extract_date,
            endDate: projectInfo.extract_date,
            budget: 0,
            status: '已完成',
        };
        const newRemoteProject = await this.postRequest<RemoteProject>('/project/add', remoteProject);

        const record: SelectionRecord = {
            id: newRemoteProject.projectId!.toString(),
            project: this.mapRemoteProjectToProject(newRemoteProject),
            finalExperts, log, status: '正常抽取', timestamp: new Date().toISOString(),
        };

        await this.addLog(actor.user_id, actor.username, '专家抽取', '抽取', `为项目 "${record.project.project_name}" 完成了专家抽取`);

        return record;
    }

    // --- ById Getters ---
    async getSysUserById(id: number): Promise<SysUser | undefined> {
        const allUsers = await this.getSysUsers();
        return allUsers.find(u => u.user_id === id);
    }

    async getExpertByIdCard(idCard: string): Promise<Expert | undefined> {
        const allExperts = await this.getExperts();
        return allExperts.find(e => e.id_card === idCard);
    }

    // --- Mocked/Unsupported Methods ---
    async getCategories(): Promise<ExpertCategory[]> { return Promise.resolve([{ category_id: 'cat001', name: '技术类' }, { category_id: 'cat002', name: '经济类' }, { category_id: 'cat003', name: '医学类' }, { category_id: 'cat004', name: '监督员' }]); }
    async getCategoryById(id: string): Promise<ExpertCategory | undefined> {
        const cats = await this.getCategories();
        return cats.find(c => c.category_id === id);
    }

    unsupported(feature: string = "此功能") {
        return new Error(`${feature}在远程模式下不可用，因为后端API未提供相应接口。`);
    }

    async updatePerson(userId: number, personData: NewUserAndExpert, actor: AuthenticatedUser): Promise<void> { throw this.unsupported("更新人员信息"); }
    async addCategory(name: string, actor: AuthenticatedUser): Promise<ExpertCategory> { throw this.unsupported("添加类别"); }
    async updateCategory(category: ExpertCategory, actor: AuthenticatedUser): Promise<ExpertCategory> { throw this.unsupported("更新类别"); }
    async deleteCategory(categoryId: string, actor: AuthenticatedUser): Promise<void> { throw this.unsupported("删除类别"); }
    async replaceExpert(recordId: string, expertToReplaceIdCard: string, reason: string, actor: AuthenticatedUser): Promise<SelectionRecord> { throw this.unsupported("补抽专家"); }
}

export const realApi = new RealApiService();
