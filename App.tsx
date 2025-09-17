
import React, { useState, useEffect, useMemo } from 'react';
import { AuthenticatedUser, SelectionRecord } from './types';
import { api } from './services/apiService';
import {
  HomeIcon, BriefcaseIcon, DatabaseIcon, SparklesIcon, TagIcon, TerminalIcon, LogoutIcon, LoginIcon, ChevronDownIcon, UserGroupIcon, DownloadIcon, ClipboardListIcon, SearchIcon, CogIcon
} from './components/icons';
import {
  ExpertManagementView
} from './views/ExpertManagementView';
import {
  ExpertSelectionView
} from './views/ExpertSelectionView';
import {
  SelectionResultsView
} from './views/SelectionResultsView';
import { SystemManagementView } from './views/SystemManagementView';
import { CategoryManagementView } from './views/CategoryManagementView';
import { DataExportView } from './views/DataExportView';
import { AdvancedSettingsView } from './views/AdvancedSettingsView';
import { Button, Input } from './components/common';


type View = 'dashboard' | 'experts' | 'selection' | 'results' | 'system' | 'categories' | 'export' | 'advancedSettings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [latestSelectionResult, setLatestSelectionResult] = useState<SelectionRecord | null>(null);

  useEffect(() => {
    const loggedInUser = sessionStorage.getItem('currentUser');
    if (loggedInUser) {
      setCurrentUser(JSON.parse(loggedInUser));
    }
  }, []);


  const handleLogin = (user: AuthenticatedUser) => {
    setCurrentUser(user);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      <Sidebar activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="container mx-auto">
            <ViewRenderer 
              activeView={activeView} 
              setActiveView={setActiveView} 
              currentUser={currentUser} 
              latestSelectionResult={latestSelectionResult}
              setLatestSelectionResult={setLatestSelectionResult}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

interface LoginScreenProps {
    onLogin: (user: AuthenticatedUser) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        const user = await api.login(username, password);
        if (user) {
            onLogin(user);
        } else {
            setError('用户名或密码错误');
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : '登录时发生未知错误');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md border border-gray-200 overflow-hidden">
            <div className="bg-header-900 p-6 flex justify-center">
                <img src="https://www.pdsu.edu.cn/images/logo.png" alt="Pingdingshan University Logo" className="h-16" />
            </div>
            <div className="p-8">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">专家抽取系统</h2>
                <p className="text-center text-gray-500 mb-8">请使用您的账户登录</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="text-sm font-medium text-gray-500 sr-only">用户名</label>
                        <Input 
                            id="username"
                            type="text"
                            placeholder="用户名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-500 sr-only">密码</label>
                        <Input 
                            id="password"
                            type="password"
                            placeholder="密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <Button type="submit" className="w-full" variant="primary" size="lg" disabled={isLoading}>
                            {isLoading ? '登录中...' : <><LoginIcon className="h-5 w-5 mr-2" />登录</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
         <footer className="mt-8 text-center text-gray-500 text-sm">
            技术支持：平顶山学院软件学院
        </footer>
    </div>
  );
};

const Sidebar: React.FC<{ activeView: View; setActiveView: (view: View) => void; currentUser: AuthenticatedUser }> = ({ activeView, setActiveView, currentUser }) => {
    const { permissions, permissions: { isSuperAdmin } } = currentUser;

    const topLevelItems = [
        { id: 'dashboard', label: '系统首页', icon: <HomeIcon />, permission: true },
        { id: 'results', label: '项目信息', icon: <BriefcaseIcon />, permission: permissions.selectionResults },
    ];

    const adminMenu = [
        {
            title: '操作',
            items: [
                { id: 'selection', label: '专家抽取', icon: <SparklesIcon />, permission: permissions.expertSelection },
            ]
        },
        {
            title: '数据管理',
            items: [
                { id: 'experts', label: '人员管理', icon: <DatabaseIcon />, permission: permissions.expertManagement.view },
                { id: 'categories', label: '专家类别管理', icon: <TagIcon />, permission: isSuperAdmin },
            ]
        },
        {
            title: '系统管理',
            items: [
                { id: 'system', label: '系统日志', icon: <TerminalIcon />, permission: permissions.isSuperAdmin },
                { id: 'export', label: '数据导出', icon: <DownloadIcon />, permission: permissions.isSuperAdmin },
                { id: 'advancedSettings', label: '高级设置', icon: <CogIcon />, permission: permissions.isSuperAdmin },
            ]
        }
    ];

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        Object.fromEntries(adminMenu.map(section => [section.title, true]))
    );

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const userMenu = [
        { id: 'experts', label: '人员管理', icon: <DatabaseIcon />, permission: permissions.expertManagement.view },
        { id: 'selection', label: '专家抽取', icon: <SparklesIcon />, permission: permissions.expertSelection },
    ];
    
    return (
        <aside className="w-64 bg-primary-50 text-gray-700 flex flex-col border-r border-gray-200">
            <div className="h-20 flex items-center justify-center px-6 bg-header-900">
                <img src="https://www.pdsu.edu.cn/images/logo.png" alt="平顶山学院 Logo" className="h-12 w-auto" />
            </div>
            <nav className="flex-1 px-4 py-4 overflow-y-auto">
                 <ul className="space-y-2">
                    {topLevelItems.filter(item => item.permission).map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => setActiveView(item.id as View)}
                                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${activeView === item.id ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-600 hover:bg-primary-100 hover:text-primary-700'}`}>
                                <span className="w-6 h-6 mr-3">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>

                {isSuperAdmin ? (
                    <ul className="space-y-2 mt-4 pt-4 border-t border-gray-200">
                        {adminMenu.map(section => (
                            <li key={section.title}>
                                <button onClick={() => toggleSection(section.title)} className="w-full flex justify-between items-center p-3 text-gray-500 hover:bg-gray-200 rounded-lg">
                                    <span className="font-semibold text-sm uppercase tracking-wider">{section.title}</span>
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${openSections[section.title] ? 'rotate-180' : ''}`} />
                                </button>
                                {openSections[section.title] && (
                                    <ul className="pl-4 mt-1 space-y-1">
                                        {section.items.filter(item => item.permission).map(item => (
                                            <li key={item.id}>
                                                <button onClick={() => setActiveView(item.id as View)} className={`w-full flex items-center p-2.5 rounded-md transition-all duration-200 ${activeView === item.id ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-primary-100 hover:text-primary-700'}`}>
                                                    <span className="w-6 h-6 mr-3">{item.icon}</span>
                                                    <span>{item.label}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="space-y-2 mt-2">
                        {userMenu.filter(item => item.permission).map(item => (
                            <li key={item.id}>
                                <button
                                    onClick={() => setActiveView(item.id as View)}
                                    className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${activeView === item.id ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-600 hover:bg-primary-100 hover:text-primary-700'}`}>
                                    <span className="w-6 h-6 mr-3">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </nav>
        </aside>
    );
};

const Header: React.FC<{ currentUser: AuthenticatedUser; onLogout: () => void; }> = ({ currentUser, onLogout }) => {
    return (
        <header className="h-20 bg-header-900 text-white flex items-center justify-between px-6">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-white">专家抽取系统</h1>
            </div>
            <div className="flex items-center">
                <div className="mr-4 text-right">
                    <div className="font-semibold text-white">{currentUser.name}</div>
                    <div className="text-sm text-gray-300">{currentUser.permissions.isSuperAdmin ? '超级管理员' : (currentUser.role === '专家' ? '专家用户' : '普通用户')}</div>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 rounded-full text-gray-300 hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-header-900 focus:ring-primary-500 transition-colors"
                  aria-label="Logout"
                >
                    <LogoutIcon className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
};

interface ViewRendererProps {
  activeView: View;
  setActiveView: (view: View) => void;
  currentUser: AuthenticatedUser;
  latestSelectionResult: SelectionRecord | null;
  setLatestSelectionResult: (record: SelectionRecord | null) => void;
}

const ViewRenderer: React.FC<ViewRendererProps> = ({ activeView, setActiveView, currentUser, latestSelectionResult, setLatestSelectionResult }) => {
  switch (activeView) {
    case 'dashboard':
      return <DashboardView setActiveView={setActiveView} currentUser={currentUser} />;
    case 'experts':
      return <ExpertManagementView currentUser={currentUser} />;
    case 'selection':
      return <ExpertSelectionView setActiveView={setActiveView} setLatestSelectionResult={setLatestSelectionResult} currentUser={currentUser} />;
    case 'results':
      return <SelectionResultsView currentUser={currentUser} latestSelectionResult={latestSelectionResult} setLatestSelectionResult={setLatestSelectionResult} />;
    case 'categories':
        return <CategoryManagementView currentUser={currentUser} />;
    case 'system':
      return <SystemManagementView />;
    case 'export':
        return <DataExportView />;
    case 'advancedSettings':
        return <AdvancedSettingsView />;
    default:
      return <DashboardView setActiveView={setActiveView} currentUser={currentUser} />;
  }
};

const DashboardView: React.FC<{ setActiveView: (view: View) => void, currentUser: AuthenticatedUser }> = ({ setActiveView, currentUser }) => {
    const isAdmin = currentUser.permissions.isSuperAdmin;
    const [myExpertProjects, setMyExpertProjects] = useState<SelectionRecord[]>([]);
    const [stats, setStats] = useState({ expertCount: 0, selectionCount: 0, userCount: 0, categoryCount: 0 });

    useEffect(() => {
        const fetchDashboardData = async () => {
             try {
                // Fetch stats
                const fetchedStats = await api.getStats();
                setStats(fetchedStats);

                // Find user's projects
                if (currentUser.role !== '专家') {
                    setMyExpertProjects([]);
                    return;
                }
            
                const allRecords = await api.getSelectionRecords();
                const myExpertProfile = (await api.getExperts()).find(e => e.user_id === currentUser.user_id);
                if (!myExpertProfile) return;

                const projects = allRecords.filter(record => 
                    record.finalExperts.some(fe => fe.expertIdCard === myExpertProfile.id_card)
                ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setMyExpertProjects(projects);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };

        fetchDashboardData();
    }, [currentUser]);
    
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">欢迎回来, <span className="text-primary-600">{currentUser.name}</span>！</h1>
        
        {myExpertProjects.length > 0 && (
            <div className="my-8 bg-primary-100 p-6 rounded-lg shadow-lg border border-primary-200">
                <h2 className="text-xl font-semibold text-primary-700 mb-4">个人项目信息</h2>
                <div className="text-gray-700">
                    <p>您好, {currentUser.name}。您已被选为以下项目的评审专家：</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        {myExpertProjects.slice(0, 3).map(p => <li key={p.id}>{p.project.project_name}</li>)}
                    </ul>
                    {myExpertProjects.length > 3 && (
                        <p className="text-sm text-gray-500 mt-2">...等共 {myExpertProjects.length} 个项目。</p>
                    )}
                    <p className="mt-3 text-sm">详情请等待项目经办人联系。</p>
                    {myExpertProjects.length > 1 && (
                        <Button variant="secondary" size="sm" onClick={() => setActiveView('results')} className="mt-4">
                            跳转到项目信息页面
                        </Button>
                     )}
                </div>
            </div>
        )}

        <div className="my-8 bg-white p-8 rounded-lg shadow-lg text-center border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">开始新的任务</h2>
            <p className="text-gray-500 mb-6">点击下方按钮，立即开始一个新的专家抽取项目。</p>
            <Button variant="primary" size="lg" className="px-12 py-4 text-lg" onClick={() => setActiveView('selection')}>
                <SparklesIcon className="h-6 w-6 mr-3" />
                创建新项目并抽取专家
            </Button>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center border border-gray-200">
                <div className="bg-primary-100 p-4 rounded-full mr-4"><DatabaseIcon className="h-8 w-8 text-primary-500" /></div>
                <div>
                    <p className="text-sm text-gray-500">专家总数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.expertCount}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center border border-gray-200">
                <div className="bg-green-100 p-4 rounded-full mr-4"><ClipboardListIcon className="h-8 w-8 text-green-500" /></div>
                <div>
                    <p className="text-sm text-gray-500">已完成抽取</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.selectionCount}</p>
                </div>
            </div>
            {isAdmin && (
              <>
                 <div className="bg-white p-6 rounded-lg shadow-lg flex items-center border border-gray-200">
                    <div className="bg-yellow-100 p-4 rounded-full mr-4"><UserGroupIcon className="h-8 w-8 text-yellow-500" /></div>
                    <div>
                        <p className="text-sm text-gray-500">总用户数</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.userCount}</p>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-lg flex items-center border border-gray-200">
                    <div className="bg-indigo-100 p-4 rounded-full mr-4"><TagIcon className="h-8 w-8 text-indigo-500" /></div>
                    <div>
                        <p className="text-sm text-gray-500">专家类别</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.categoryCount}</p>
                    </div>
                </div>
              </>
            )}
        </div>
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">系统公告</h2>
            <p className="text-gray-600">
                欢迎使用新版专家抽取系统。本系统旨在提供一个公平、公正、高效的专家随机抽取平台。请确保专家库信息及时更新，所有抽取过程均有日志记录，以备查验。如有任何问题，请联系系统管理员。
            </p>
        </div>
      </div>
    );
};


export default App;
