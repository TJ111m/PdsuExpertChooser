import { ExpertCategory, Project, SelectionConfiguration, SelectionRecord, SelectionLogEntry, SysUser, Expert, SysLog, NewUserAndExpert, AuthenticatedUser } from '../types';
import { IApiService } from './apiService';

const LOCAL_STORAGE_KEY = 'expertSystemData_v2';

interface AppData {
  sys_users: SysUser[];
  experts: Expert[];
  categories: ExpertCategory[];
  projects: Project[];
  selectionRecords: SelectionRecord[];
  systemLogs: SysLog[];
  nextUserIntId: number;
  nextProjectIntId: number;
  nextLogIntId: number;
}

const defaultPermissions = {
  isSuperAdmin: false,
  expertManagement: { view: true, add: false, edit: false, delete: false },
  expertSelection: true,
  selectionResults: true,
};

const superAdminPermissions = {
  isSuperAdmin: true,
  expertManagement: { view: true, add: true, edit: true, delete: true },
  expertSelection: true,
  selectionResults: true,
};

const getInitialData = (): AppData => {
  const categories = [
    { category_id: 'cat001', name: '技术类' },
    { category_id: 'cat002', name: '经济类' },
    { category_id: 'cat003', name: '医学类' },
    { category_id: 'cat004', name: '监督员' },
  ];

  const sys_users: SysUser[] = [
    { user_id: 1, username: 'admin', name: '超级管理员', passwordHash: '123456', role: '管理员', permissions: superAdminPermissions, user_status: 1, businessScope: '全校' },
    { user_id: 2, username: '13812345678', name: '张三', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 3, username: '13987654321', name: '李四', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 4, username: '13711112222', name: '王五', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 5, username: '13633334444', name: '赵六', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 0, businessScope: '' },
    { user_id: 6, username: '13555556666', name: '孙七', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 7, username: '13444445555', name: '周八', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 8, username: '13333332222', name: '吴九', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 9, username: '13222221111', name: '郑十', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 10, username: '13111119999', name: '冯十一', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 11, username: '13000008888', name: '陈十二', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 12, username: '12999997777', name: '褚十三', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 13, username: '12888886666', name: '卫十四', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 14, username: '12777775555', name: '蒋十五', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 0, businessScope: '' },
    { user_id: 15, username: '12666664444', name: '沈十六', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
    { user_id: 16, username: '12555553333', name: '韩十七', passwordHash: '123456', role: '专家', permissions: defaultPermissions, user_status: 1, businessScope: '' },
  ];

  const experts: Expert[] = [
      { user_id: 2, name: '张三', contact_info: '13812345678', gender: 1, birth_date: '1970-01-15', category_id: 'cat001', id_card: '410402197001151234', work_unit: '平顶山学院', department: '计算机学院', professional_title: '教授', discipline: '软件工程', bank_card: '6222...1234', in_service_status: 1, is_internal: 1 },
      { user_id: 3, name: '李四', contact_info: '13987654321', gender: 0, birth_date: '1982-05-20', category_id: 'cat002', id_card: '410403198205205678', work_unit: '平顶山学院', department: '经管学院', professional_title: '副教授', discipline: '会计学', bank_card: '6222...5678', in_service_status: 1, is_internal: 1 },
      { user_id: 4, name: '王五', contact_info: '13711112222', gender: 1, birth_date: '1965-11-30', category_id: 'cat003', id_card: '410404196511309012', work_unit: '平顶山学院', department: '医学院', professional_title: '主任医师', discipline: '临床医学', bank_card: '6222...9012', in_service_status: 1, is_internal: 1 },
      { user_id: 5, name: '赵六', contact_info: '13633334444', gender: 0, birth_date: '1978-08-08', category_id: 'cat001', id_card: '410402197808083456', work_unit: '平顶山学院', department: '电气学院', professional_title: '教授', discipline: '自动化', bank_card: '6222...3456', in_service_status: 0, is_internal: 1 },
      { user_id: 6, name: '孙七', contact_info: '13555556666', gender: 1, birth_date: '1985-03-12', category_id: 'cat004', id_card: '410402198503127890', work_unit: '平顶山学院', department: '纪检委', professional_title: '处长', discipline: '行政管理', bank_card: '6222...7890', in_service_status: 1, is_internal: 1 },
      { user_id: 7, name: '周八', contact_info: '13444445555', gender: 0, birth_date: '1990-07-21', category_id: 'cat002', id_card: '410403199007211122', work_unit: '平顶山学院', department: '金融系', professional_title: '讲师', discipline: '国际贸易', bank_card: '6222...1122', in_service_status: 1, is_internal: 1 },
      { user_id: 8, name: '吴九', contact_info: '13333332222', gender: 1, birth_date: '1976-09-01', category_id: 'cat001', id_card: '410404197609013344', work_unit: '平顶山学院', department: '土木工程学院', professional_title: '高级工程师', discipline: '结构工程', bank_card: '6222...3344', in_service_status: 1, is_internal: 1 },
      { user_id: 9, name: '郑十', contact_info: '13222221111', gender: 0, birth_date: '1988-12-18', category_id: 'cat003', id_card: '410402198812185566', work_unit: '平顶山学院', department: '护理学院', professional_title: '副教授', discipline: '护理学', bank_card: '6222...5566', in_service_status: 1, is_internal: 1 },
      { user_id: 10, name: '冯十一', contact_info: '13111119999', gender: 1, birth_date: '1969-02-28', category_id: 'cat001', id_card: '410403196902287788', work_unit: '平顶山学院', department: '化学化工学院', professional_title: '教授', discipline: '材料化学', bank_card: '6222...7788', in_service_status: 1, is_internal: 1 },
      { user_id: 11, name: '陈十二', contact_info: '13000008888', gender: 0, birth_date: '1983-06-06', category_id: 'cat002', id_card: '410404198306069900', work_unit: '平顶山学院', department: '旅游管理系', professional_title: '副教授', discipline: '酒店管理', bank_card: '6222...9900', in_service_status: 1, is_internal: 1 },
      { user_id: 12, name: '褚十三', contact_info: '12999997777', gender: 1, birth_date: '1975-10-10', category_id: 'cat004', id_card: '41040219751010101X', work_unit: '平顶山学院', department: '审计处', professional_title: '副处长', discipline: '审计学', bank_card: '6222...101X', in_service_status: 1, is_internal: 1 },
      { user_id: 13, name: '卫十四', contact_info: '12888886666', gender: 0, birth_date: '1991-04-14', category_id: 'cat003', id_card: '410403199104142021', work_unit: '平顶山学院', department: '药学院', professional_title: '讲师', discipline: '药剂学', bank_card: '6222...2021', in_service_status: 1, is_internal: 1 },
      { user_id: 14, name: '蒋十五', contact_info: '12777775555', gender: 1, birth_date: '1980-01-23', category_id: 'cat001', id_card: '410404198001233032', work_unit: '平顶山学院', department: '文学院', professional_title: '教授', discipline: '汉语言文学', bank_card: '6222...3032', in_service_status: 0, is_internal: 1 },
      { user_id: 15, name: '沈十六', contact_info: '12666664444', gender: 0, birth_date: '1972-07-07', category_id: 'cat002', id_card: '410402197207074043', work_unit: '平顶山学院', department: '法学院', professional_title: '教授', discipline: '经济法', bank_card: '6222...4043', in_service_status: 1, is_internal: 1 },
      { user_id: 16, name: '韩十七', contact_info: '12555553333', gender: 1, birth_date: '1986-08-16', category_id: 'cat003', id_card: '410403198608165054', work_unit: '平顶山学院', department: '口腔医学院', professional_title: '主治医师', discipline: '口腔正畸学', bank_card: '6222...5054', in_service_status: 1, is_internal: 1 },
  ];

  return {
    sys_users,
    experts,
    categories,
    projects: [],
    selectionRecords: [],
    systemLogs: [],
    nextUserIntId: 17,
    nextProjectIntId: 1,
    nextLogIntId: 1,
  };
};


class MockApiService implements IApiService {
  private data: AppData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): AppData {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      // Check for old version and clear if exists
      if(localStorage.getItem('expertSystemData')) {
          localStorage.removeItem('expertSystemData');
      }
    } catch (error) {
      console.error("Failed to load data from localStorage, resetting.", error);
    }
    const initialData = getInitialData();
    this.saveData(initialData);
    return initialData;
  }

  private saveData(dataToSave?: AppData) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave || this.data));
    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }

  // FIX: Updated method signature to match IApiService interface.
  public async addLog(user_id: number, username: string, operation_module: string, operation_type: string, operation_content: string): Promise<void> {
    this.data.systemLogs.unshift({
        log_id: this.data.nextLogIntId++,
        operation_time: new Date().toISOString(),
        user_id,
        operation_module,
        operation_type,
        operation_content,
        operation_result: 1, // Assuming success for mock
        remark: `用户: ${username}`,
        ip_address: '127.0.0.1',
    });
    this.saveData();
  }
  
  // Auth
  async login(username: string, password: string):Promise<AuthenticatedUser | null> {
    const user = this.data.sys_users.find(u => u.username === username && u.passwordHash === password);
    if(user && user.user_status === 1) {
        // FIX: Added username parameter to addLog call.
        this.addLog(user.user_id, user.username, '登录模块', '用户登录', `用户 ${user.name} 登录成功`);
        return Promise.resolve(user);
    }
    return Promise.resolve(null);
  }

  // Stats
  async getStats() {
    return Promise.resolve({
      expertCount: this.data.experts.length,
      selectionCount: this.data.selectionRecords.length,
      userCount: this.data.sys_users.length,
      categoryCount: this.data.categories.length,
    });
  }
  
  // Personnel Management
  async getSysUsers(): Promise<SysUser[]> {
    return Promise.resolve(this.data.sys_users);
  }

  async getExperts(): Promise<Expert[]> {
    return Promise.resolve(this.data.experts);
  }

  async addPerson(person: NewUserAndExpert, actor: AuthenticatedUser): Promise<void> {
    if (this.data.sys_users.some(u => u.username === person.username)) {
        throw new Error("登录账号已存在");
    }
    if (person.role === '专家' && person.id_card && this.data.experts.some(e => e.id_card === person.id_card)) {
        throw new Error("身份证号已存在");
    }

    const newUserId = this.data.nextUserIntId++;
    const newUser: SysUser = {
      user_id: newUserId,
      username: person.username,
      name: person.name,
      passwordHash: person.password || '123456',
      user_status: person.user_status,
      permissions: person.role === '管理员' ? (person.permissions.isSuperAdmin ? superAdminPermissions : { ...defaultPermissions, expertManagement: { view: true, add: true, edit: true, delete: false }}) : defaultPermissions,
      role: person.role,
      businessScope: person.businessScope || '',
    };
    this.data.sys_users.push(newUser);

    if (person.role === '专家') {
      const newExpert: Expert = {
        user_id: newUserId,
        id_card: person.id_card!,
        name: person.name,
        gender: person.gender!,
        birth_date: person.birth_date!,
        category_id: person.category_id!,
        work_unit: person.work_unit!,
        department: person.department!,
        professional_title: person.professional_title!,
        discipline: person.discipline!,
        contact_info: person.contact_info!,
        bank_card: person.bank_card,
        in_service_status: person.in_service_status!,
        is_internal: person.is_internal!,
      };
      this.data.experts.push(newExpert);
    }
    
    // FIX: Added username parameter to addLog call.
    this.addLog(actor.user_id, actor.username, '人员管理', '新增', `新增${person.role}: ${person.name}`);
    this.saveData();
    return Promise.resolve();
  }

  async updatePerson(userId: number, personData: NewUserAndExpert, actor: AuthenticatedUser): Promise<void> {
    const userIndex = this.data.sys_users.findIndex(u => u.user_id === userId);
    if (userIndex === -1) throw new Error("User not found");

    if (this.data.sys_users.some(u => u.username === personData.username && u.user_id !== userId)) {
        throw new Error("登录账号已存在");
    }
    
    const oldUser = this.data.sys_users[userIndex];
    this.data.sys_users[userIndex] = {
      ...oldUser,
      username: personData.username,
      name: personData.name,
      user_status: personData.user_status,
      businessScope: personData.businessScope,
    };

    if (oldUser.role === '专家') {
      const expertIndex = this.data.experts.findIndex(e => e.user_id === userId);
      if (expertIndex !== -1) {
          if (personData.id_card && this.data.experts.some(e => e.id_card === personData.id_card && e.user_id !== userId)) {
             throw new Error("身份证号已存在");
          }
          this.data.experts[expertIndex] = {
              ...this.data.experts[expertIndex],
              id_card: personData.id_card!,
              name: personData.name,
              gender: personData.gender!,
              birth_date: personData.birth_date!,
              category_id: personData.category_id!,
              work_unit: personData.work_unit!,
              department: personData.department!,
              professional_title: personData.professional_title!,
              discipline: personData.discipline!,
              contact_info: personData.contact_info!,
              bank_card: personData.bank_card,
              in_service_status: personData.in_service_status!,
              is_internal: personData.is_internal!,
          };
      }
    }

    // FIX: Added username parameter to addLog call.
    this.addLog(actor.user_id, actor.username, '人员管理', '修改', `修改${oldUser.role}信息: ${personData.name}`);
    this.saveData();
    return Promise.resolve();
  }

  async deletePerson(userId: number, actor: AuthenticatedUser): Promise<void> {
    const user = this.data.sys_users.find(u => u.user_id === userId);
    if (!user) throw new Error("User not found");

    const adminCount = this.data.sys_users.filter(u => u.role === '管理员').length;
    if (user.role === '管理员' && adminCount <= 1) {
        throw new Error("不能删除最后一个管理员账户");
    }
    
    this.data.sys_users = this.data.sys_users.filter(u => u.user_id !== userId);
    if(user.role === '专家') {
        this.data.experts = this.data.experts.filter(e => e.user_id !== userId);
    }
    
    // FIX: Added username parameter to addLog call.
    this.addLog(actor.user_id, actor.username, '人员管理', `删除`, `删除${user.role}: ${user.name} (ID: ${userId})`);
    this.saveData();
    return Promise.resolve();
  }


  // Categories
  async getCategories(): Promise<ExpertCategory[]> {
    return Promise.resolve(this.data.categories);
  }
  
  async addCategory(name: string, actor: AuthenticatedUser): Promise<ExpertCategory> {
    if (this.data.categories.some(c => c.name === name)) {
      throw new Error("该类别已存在");
    }
    const newCategory: ExpertCategory = { category_id: crypto.randomUUID(), name };
    this.data.categories.push(newCategory);
    // FIX: Added username parameter to addLog call.
    this.addLog(actor.user_id, actor.username, '类别管理', '新增', `新增类别: ${name}`);
    this.saveData();
    return Promise.resolve(newCategory);
  }
  
  // FIX: Converted to async to support async getCategoryById call.
  async updateCategory(category: ExpertCategory, actor: AuthenticatedUser): Promise<ExpertCategory> {
    const index = this.data.categories.findIndex(c => c.category_id === category.category_id);
    if (index === -1) throw new Error("Category not found");
    if (this.data.categories.some(c => c.name === category.name && c.category_id !== category.category_id)) {
        throw new Error("该类别已存在");
    }
    const oldName = this.data.categories[index].name;
    this.data.categories[index] = category;
    
    // Also update expert category names if they exist (denormalized for convenience)
    // FIX: Used for...of loop to handle await correctly.
    for (const e of this.data.experts) {
        const cat = await this.getCategoryById(e.category_id);
        if(cat && e.category_id === category.category_id) {
            // this is not ideal, in real DB this would be a join
        }
    }

    // FIX: Added username parameter to addLog call.
    this.addLog(actor.user_id, actor.username, '类别管理', '修改', `修改类别: ${oldName} -> ${category.name}`);
    this.saveData();
    return category;
  }

  async deleteCategory(categoryId: string, actor: AuthenticatedUser): Promise<void> {
    if(this.data.experts.some(e => e.category_id === categoryId)) {
        throw new Error("无法删除：该类别下尚有专家存在。");
    }
    const categoryName = this.data.categories.find(c=>c.category_id === categoryId)?.name || '未知';
    this.data.categories = this.data.categories.filter(c => c.category_id !== categoryId);
    // FIX: Added username parameter to addLog call.
    this.addLog(actor.user_id, actor.username, '类别管理', '删除', `删除类别: ${categoryName} (ID: ${categoryId})`);
    this.saveData();
    return Promise.resolve();
  }
  
  // Selection
  async createProjectAndSelectExperts(
    projectInfo: Omit<Project, 'project_id' | 'project_no' | 'project_status'>,
    configs: SelectionConfiguration[],
    actor: AuthenticatedUser
  ): Promise<SelectionRecord> {
    const project: Project = {
        ...projectInfo,
        project_id: this.data.nextProjectIntId++,
        project_no: `PDSU-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        project_status: 2, // Completed
    };
    this.data.projects.push(project);
    
    const finalExperts: { expertIdCard: string; categoryName: string }[] = [];
    const log: SelectionLogEntry[] = [];
    const allSelectedIds = new Set<string>();

    for (const config of configs) {
        const categoryName = (await this.getCategoryById(config.categoryId))?.name || '未知';
        let pool = this.data.experts.filter(e => 
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
            allSelectedIds.add(expert.id_card);
            log.push({
                timestamp: new Date().toISOString(),
                type: 'initial',
                message: `从类别 "${categoryName}" 中成功抽取专家`,
                newExpertName: expert.name,
            });
        });
    }

    const newRecord: SelectionRecord = {
        id: crypto.randomUUID(),
        project,
        finalExperts,
        log,
        status: '正常抽取',
        timestamp: new Date().toISOString(),
    };

    this.data.selectionRecords.push(newRecord);
    // FIX: Added username parameter to addLog call.
    this.addLog(actor.user_id, actor.username, '专家抽取', '抽取', `为项目 "${project.project_name}" 完成了专家抽取`);
    this.saveData();
    return Promise.resolve(newRecord);
  }

  async replaceExpert(
    recordId: string,
    expertToReplaceIdCard: string,
    reason: string,
    actor: AuthenticatedUser
  ): Promise<SelectionRecord> {
    const record = this.data.selectionRecords.find(r => r.id === recordId);
    if (!record) throw new Error("Selection record not found");

    const entryToReplace = record.finalExperts.find(fe => fe.expertIdCard === expertToReplaceIdCard);
    if (!entryToReplace) throw new Error("Expert to replace not found in this record");
    
    const expertToReplace = this.data.experts.find(e => e.id_card === expertToReplaceIdCard);
    if (!expertToReplace) throw new Error("Expert to replace data not found");

    const alreadySelectedIds = record.finalExperts.map(fe => fe.expertIdCard);

    let pool = this.data.experts.filter(e => 
        e.category_id === expertToReplace.category_id &&
        e.in_service_status === 1 &&
        !alreadySelectedIds.includes(e.id_card)
    );

    if (pool.length === 0) {
      throw new Error(`类别 "${entryToReplace.categoryName}" 中已无备选专家可供补抽。`);
    }

    const newExpert = pool[Math.floor(Math.random() * pool.length)];

    record.finalExperts = record.finalExperts.map(fe => 
        fe.expertIdCard === expertToReplaceIdCard 
        ? { expertIdCard: newExpert.id_card, categoryName: entryToReplace.categoryName } 
        : fe
    );
    record.status = '有补抽';
    record.log.push({
        timestamp: new Date().toISOString(),
        type: 'replacement',
        message: `补抽专家替换 ${expertToReplace.name}`,
        replacedExpertName: expertToReplace.name,
        newExpertName: newExpert.name,
        reason,
    });
    
    // FIX: Added username parameter to addLog call.
    this.addLog(actor.user_id, actor.username, '专家抽取', '补抽', `为项目 "${record.project.project_name}" 补抽专家, ${newExpert.name} 替换 ${expertToReplace.name}`);
    this.saveData();
    return Promise.resolve(record);
  }

  async getSelectionRecords(): Promise<SelectionRecord[]> {
    return Promise.resolve(this.data.selectionRecords);
  }
  
  async getSystemLogs(): Promise<SysLog[]> {
      return Promise.resolve(this.data.systemLogs);
  }
  
  // FIX: Converted to async to match interface.
  async getSysUserById(id: number): Promise<SysUser | undefined> {
      return this.data.sys_users.find(u => u.user_id === id);
  }
  
  // FIX: Converted to async to match interface.
  async getExpertByIdCard(idCard: string): Promise<Expert | undefined> {
      return this.data.experts.find(e => e.id_card === idCard);
  }

  // FIX: Converted to async to match interface.
  async getCategoryById(id: string): Promise<ExpertCategory | undefined> {
      return this.data.categories.find(c => c.category_id === id);
  }
}

export const mockApi = new MockApiService();