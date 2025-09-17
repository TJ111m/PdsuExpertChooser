// types.ts

// Base types directly mapping to the new database schema

export interface SysUser {
  user_id: number;
  username: string;
  passwordHash: string;
  name: string; // Not in schema, but required by UI. Assumed to exist for app functionality.
  user_status: 1 | 0; // 1 = 启用, 0 = 禁用
  permissions: Permissions; // Not in schema, but required by UI for roles.
  role: '专家' | '管理员'; // Not in schema, but required for logic.
  businessScope: string; // From original User type for admins
}

export interface Expert {
  id_card: string; // PK
  name: string;
  gender: 1 | 0; // 1 = 男, 0 = 女
  birth_date: string; // YYYY-MM-DD
  category_id: string; // FK to ExpertCategory
  work_unit: string;
  department: string; // Added from original structure as it's a key piece of info
  professional_title: string;
  discipline: string;
  contact_info: string;
  bank_card?: string;
  in_service_status: 1 | 0; // 1 = 在职, 0 = 离职
  is_internal: 1 | 0; // 1 = 是, 0 = 否
  user_id: number | null; // FK to SysUser, nullable
}

export interface ExpertCategory {
  category_id: string;
  name: string;
}

export interface Project {
  project_id: number;
  project_name: string;
  project_no: string;
  organization_unit: string;
  extract_date: string; // YYYY-MM-DD
  operator_user_id: number;
  supervisor: string;
  project_status: 0 | 1 | 2 | 3; // 0 = 新建, 1 = 抽取中, 2 = 已完成, 3 = 已取消
}

export interface SysLog {
    log_id: number;
    user_id: number;
    operation_module: string;
    operation_type: string;
    operation_content: string;
    operation_time: string; // ISO Date string
    ip_address: string;
    operation_result: 1 | 0; // 1 = 成功, 0 = 失败
    remark: string;
}

// Composite type for the currently logged-in user to preserve UI functionality
export type AuthenticatedUser = SysUser;


// Types for application logic, adapted from the original structure

export interface SelectionConfiguration {
  categoryId: string;
  categoryName: string;
  count: number;
  avoidExpertIds: string[]; // This will be an array of expert id_card strings
}

export interface SelectionLogEntry {
  timestamp: string;
  type: 'initial' | 'replacement';
  message: string;
  replacedExpertName?: string;
  newExpertName: string;
  reason?: string;
}

export interface SelectionRecord {
  id: string; // A unique ID for the record itself
  project: Project;
  finalExperts: { expertIdCard: string, categoryName: string }[];
  log: SelectionLogEntry[];
  status: '正常抽取' | '有补抽';
  timestamp: string;
}

export interface Permissions {
  isSuperAdmin: boolean;
  expertManagement: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
  };
  expertSelection: boolean;
  selectionResults: boolean;
}


// Types for creating new entities, used in forms
export type NewUserAndExpert = {
  // SysUser fields
  username: string;
  password?: string;
  name: string;
  user_status: 1 | 0;
  permissions: Permissions;
  role: '专家' | '管理员';
  businessScope: string;

  // Expert fields (optional)
  id_card?: string;
  gender?: 1 | 0;
  birth_date?: string;
  category_id?: string;
  work_unit?: string;
  department?: string;
  professional_title?: string;
  discipline?: string;
  contact_info?: string;
  bank_card?: string;
  in_service_status?: 1 | 0;
  is_internal?: 1 | 0;
};

// Types for remote API data structures
export interface RemoteSysUser {
    userId: number;
    username: string;
    password?: string;
    email: string | null;
    createTime: string;
    updateTime: string;
}

export interface RemoteExpert {
    idCard: string;
    name: string;
    gender: "男" | "女";
    birthDate: string;
    phone: string;
    email: string | null;
    major: string;
    degree: string;
    title: string;
}

export interface RemoteProject {
    projectId?: number;
    projectNo: string;
    projectName: string;
    description: string;
    startDate: string;
    endDate: string;
    budget: number;
    status: string;
}

export interface RemoteLog {
    logId?: number;
    userId: number;
    username: string;
    operation: string;
    method: string;
    params: string;
    ip: string;
    createTime: string;
}
