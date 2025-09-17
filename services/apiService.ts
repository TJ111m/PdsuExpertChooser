import { AuthenticatedUser, Expert, ExpertCategory, NewUserAndExpert, Project, SelectionConfiguration, SelectionRecord, SysLog, SysUser } from '../types';
import { realApi } from './realApi';

export interface IApiService {
    login(username: string, password: string): Promise<AuthenticatedUser | null>;
    getStats(): Promise<{ expertCount: number; selectionCount: number; userCount: number; categoryCount: number; }>;
    getSysUsers(): Promise<SysUser[]>;
    getExperts(): Promise<Expert[]>;
    addPerson(person: NewUserAndExpert, actor: AuthenticatedUser): Promise<void>;
    updatePerson(userId: number, personData: NewUserAndExpert, actor: AuthenticatedUser): Promise<void>;
    deletePerson(userId: number, actor: AuthenticatedUser): Promise<void>;
    getCategories(): Promise<ExpertCategory[]>;
    addCategory(name: string, actor: AuthenticatedUser): Promise<ExpertCategory>;
    updateCategory(category: ExpertCategory, actor: AuthenticatedUser): Promise<ExpertCategory>;
    deleteCategory(categoryId: string, actor: AuthenticatedUser): Promise<void>;
    createProjectAndSelectExperts(projectInfo: Omit<Project, 'project_id' | 'project_no' | 'project_status'>, configs: SelectionConfiguration[], actor: AuthenticatedUser): Promise<SelectionRecord>;
    replaceExpert(recordId: string, expertToReplaceIdCard: string, reason: string, actor: AuthenticatedUser): Promise<SelectionRecord>;
    getSelectionRecords(): Promise<SelectionRecord[]>;
    getSystemLogs(): Promise<SysLog[]>;
    addLog(user_id: number, username: string, operation_module: string, operation_type: string, operation_content: string): Promise<void>;
    getSysUserById(id: number): Promise<SysUser | undefined>;
    getExpertByIdCard(idCard: string): Promise<Expert | undefined>;
    getCategoryById(id: string): Promise<ExpertCategory | undefined>;
}

/**
 * API Service Configuration
 * 
 * This file now exclusively exports the `realApi` service.
 * The application will always attempt to connect to the live remote server.
 * If any API call fails (e.g., due to network issues or server errors),
 * the promise will reject and the error will be propagated to the UI,
 * where it should be handled and displayed to the user.
 * 
 * The fallback to mock data has been removed as per the requirement.
 */
export const api: IApiService = realApi;