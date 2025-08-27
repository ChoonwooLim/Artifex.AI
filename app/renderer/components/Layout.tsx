import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Settings, Layers, Sparkles, FolderOpen, 
  History, Users, Download, Upload, Cpu, Menu, X, 
  Home, Film, Image, Palette, Wand2, GitBranch,
  ChevronRight, ChevronDown, Bell, Search, Moon, Sun
} from 'lucide-react';
import { theme } from '../styles/theme';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['projects', 'generation']));
  const [darkMode, setDarkMode] = useState(true);

  const toggleMenu = (menu: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menu)) {
      newExpanded.delete(menu);
    } else {
      newExpanded.add(menu);
    }
    setExpandedMenus(newExpanded);
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={20} />,
      view: 'dashboard',
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderOpen size={20} />,
      hasSubmenu: true,
      submenu: [
        { id: 'recent', label: 'Recent Projects', view: 'projects-recent' },
        { id: 'templates', label: 'Templates', view: 'projects-templates' },
        { id: 'shared', label: 'Shared with Me', view: 'projects-shared' },
      ],
    },
    {
      id: 'generation',
      label: 'Generation',
      icon: <Sparkles size={20} />,
      hasSubmenu: true,
      submenu: [
        { id: 't2v', label: 'Text to Video', view: 'gen-t2v' },
        { id: 'i2v', label: 'Image to Video', view: 'gen-i2v' },
        { id: 'ti2v', label: 'Text + Image to Video', view: 'gen-ti2v' },
        { id: 'batch', label: 'Batch Processing', view: 'gen-batch' },
      ],
    },
    {
      id: 'editor',
      label: 'Video Editor',
      icon: <Film size={20} />,
      view: 'editor',
    },
    {
      id: 'effects',
      label: 'Effects & Filters',
      icon: <Palette size={20} />,
      view: 'effects',
    },
    {
      id: 'ai-tools',
      label: 'AI Tools',
      icon: <Wand2 size={20} />,
      view: 'ai-tools',
    },
    {
      id: 'models',
      label: 'Model Manager',
      icon: <Cpu size={20} />,
      view: 'models',
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: <GitBranch size={20} />,
      view: 'workflows',
    },
    {
      id: 'history',
      label: 'History',
      icon: <History size={20} />,
      view: 'history',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      view: 'settings',
    },
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: theme.colors.background,
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 70 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          background: theme.colors.backgroundSecondary,
          borderRight: `1px solid ${theme.colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo Section */}
        <div style={{
          padding: theme.spacing.lg,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}>
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: theme.borderRadius.md,
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}> <Video size={24} color={theme.colors.text} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: theme.typography.fontSize.xl,
                    fontWeight: theme.typography.fontWeight.bold,
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0,
                  }}>
                    Artifex.AI
                  </h1>
                  <p style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textTertiary,
                    margin: 0,
                  }}>
                    Professional Video Suite
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.textSecondary,
              cursor: 'pointer',
              padding: theme.spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: theme.spacing.md,
        }}>
          {menuItems.map((item) => (
            <div key={item.id} style={{ marginBottom: theme.spacing.xs }}>
              <motion.button
                whileHover={{ x: 4 }}
                onClick={() => {
                  if (item.hasSubmenu) {
                    toggleMenu(item.id);
                  } else if (item.view) {
                    onViewChange(item.view);
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  background: activeView === item.view ? theme.colors.surface : 'transparent',
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  color: activeView === item.view ? theme.colors.primary : theme.colors.text,
                  cursor: 'pointer',
                  transition: `all ${theme.transitions.fast}`,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: activeView === item.view ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal,
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {item.hasSubmenu && (
                      <motion.span
                        animate={{ rotate: expandedMenus.has(item.id) ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight size={16} />
                      </motion.span>
                    )}
                  </>
                )}
              </motion.button>
              
              {/* Submenu */}
              {item.hasSubmenu && !sidebarCollapsed && (
                <AnimatePresence>
                  {expandedMenus.has(item.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {item.submenu?.map((subItem) => (
                        <motion.button
                          key={subItem.id}
                          whileHover={{ x: 4 }}
                          onClick={() => onViewChange(subItem.view)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                            paddingLeft: '48px',
                            background: activeView === subItem.view ? theme.colors.surface : 'transparent',
                            border: 'none',
                            borderRadius: theme.borderRadius.sm,
                            color: activeView === subItem.view ? theme.colors.primary : theme.colors.textSecondary,
                            cursor: 'pointer',
                            transition: `all ${theme.transitions.fast}`,
                            fontSize: theme.typography.fontSize.sm,
                            marginTop: '2px',
                          }}
                        >
                          {subItem.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        {!sidebarCollapsed && (
          <div style={{
            padding: theme.spacing.lg,
            borderTop: `1px solid ${theme.colors.border}`,
          }}>
            <div style={{
              padding: theme.spacing.md,
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              marginBottom: theme.spacing.md,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
              }}>
                <Cpu size={16} color={theme.colors.success} />
                <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.textSecondary }}>
                  GPU Status
                </span>
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.success,
              }}>
                CUDA Available • RTX 4090
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top Bar */}
        <header style={{
          height: '70px',
          background: theme.colors.backgroundSecondary,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${theme.spacing.xl}`,
        }}>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            flex: 1,
            maxWidth: '500px',
          }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${theme.colors.border}`,
            }}>
              <Search size={18} color={theme.colors.textTertiary} />
              <input
                type="text"
                placeholder="Search projects, models, or commands..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                }}
              />
            </div>
          </div>

          {/* Right Section */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.lg,
          }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                padding: theme.spacing.sm,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.colors.textSecondary,
                cursor: 'pointer',
                padding: theme.spacing.sm,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Bell size={20} />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                background: theme.colors.error,
                borderRadius: '50%',
              }} />
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Users size={20} color={theme.colors.text} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          background: theme.colors.background,
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};