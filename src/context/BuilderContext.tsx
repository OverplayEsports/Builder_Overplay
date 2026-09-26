import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type {
  BuilderState,
  BuilderTab,
  CloudflareConfig,
  CompetitiveEvent,
  CompetitivePlayer,
  EventItem,
  EventRuleSection,
  EventRulesData,
  GroupAccent,
  NewsArticle,
  ProcessPhase,
  SiteInfo,
  SocialPlatform,
  TeamGroup,
  TeamMember,
  TourneyInfoItem,
  AllyItem,
  BuilderUser,
  BuilderSectionKey,
  UserRole,
  UserStatus,
} from "../types/builder";
import {
  DEFAULT_CLOUDFLARE_CONFIG,
  DEFAULT_EVENT_RULES,
  DEFAULT_MEMBER_SOCIALS,
  GRADIENT_PRESETS,
  INITIAL_BUILDER_STATE,
  INITIAL_COMPETITIVE_EVENTS,
  INITIAL_COMPETITIVE_ROSTER,
  INITIAL_ALLIES,
  INITIAL_EVENTS,
  INITIAL_NEWS,
  INITIAL_BUILDER_USERS,
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_USERNAME,
  BUILDER_SECTIONS_LIST,
} from "../data/initialData";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "overplay_builder_state_v1";
const AUTH_EMAIL_STORAGE_KEY = "overplay_builder_current_user_email";
const USERS_STORAGE_KEY = "overplay_builder_users_list_v1";


interface BuilderContextType {
  state: BuilderState;
  activeTab: BuilderTab;
  setActiveTab: (tab: BuilderTab) => void;
  // Member operations
  addMember: (groupId: string, memberData?: Partial<TeamMember>) => void;
  updateMember: (
    groupId: string,
    memberId: string,
    updates: Partial<TeamMember>
  ) => void;
  removeMember: (groupId: string, memberId: string) => void;
  moveMember: (
    groupId: string,
    memberId: string,
    direction: "left" | "right"
  ) => void;
  // Group operations
  addGroup: (groupData?: Partial<TeamGroup>) => void;
  updateGroup: (groupId: string, updates: Partial<TeamGroup>) => void;
  removeGroup: (groupId: string) => void;
  setTeamGroups: (groups: TeamGroup[]) => void;
  // Social link helpers
  toggleMemberSocial: (
    groupId: string,
    memberId: string,
    platform: SocialPlatform,
    enabled: boolean
  ) => void;
  updateMemberSocialUrl: (
    groupId: string,
    memberId: string,
    platform: SocialPlatform,
    url: string
  ) => void;
  // Event operations
  updateEvent: (eventId: string, updates: Partial<EventItem>) => void;
  addEvent: (eventData?: Partial<EventItem>) => void;
  removeEvent: (eventId: string) => void;
  setSelectedEventId: (eventId: string) => void;
  updateTourneyInfoItem: (
    eventId: string,
    itemId: string,
    updates: Partial<TourneyInfoItem>
  ) => void;
  addTourneyInfoItem: (
    eventId: string,
    itemData?: Partial<TourneyInfoItem>
  ) => void;
  removeTourneyInfoItem: (eventId: string, itemId: string) => void;
  moveTourneyInfoItem: (
    eventId: string,
    itemId: string,
    direction: "left" | "right"
  ) => void;
  updateProcessPhase: (
    eventId: string,
    phaseId: string,
    updates: Partial<ProcessPhase>
  ) => void;
  addProcessPhase: (
    eventId: string,
    phaseData?: Partial<ProcessPhase>
  ) => void;
  removeProcessPhase: (eventId: string, phaseId: string) => void;
  moveProcessPhase: (
    eventId: string,
    phaseId: string,
    direction: "left" | "right"
  ) => void;
  addEventChip: (eventId: string, chipText: string) => void;
  removeEventChip: (eventId: string, index: number) => void;
  updateEventChip: (eventId: string, index: number, value: string) => void;
  // Rules operations
  updateEventRules: (eventId: string, updates: Partial<EventRulesData>) => void;
  addRuleSection: (
    eventId: string,
    sectionData?: Partial<EventRuleSection>
  ) => void;
  updateRuleSection: (
    eventId: string,
    sectionId: string,
    updates: Partial<EventRuleSection>
  ) => void;
  removeRuleSection: (eventId: string, sectionId: string) => void;
  // News operations
  addNewsArticle: (articleData?: Partial<NewsArticle>) => void;
  updateNewsArticle: (id: string, updates: Partial<NewsArticle>) => void;
  removeNewsArticle: (id: string) => void;
  setNewsList: (newsList: NewsArticle[]) => void;
  updateCloudflareConfig: (updates: Partial<CloudflareConfig>) => void;
  updateWordpressUrl: (url: string) => void;
  // Competitive operations
  addCompetitivePlayer: (playerData?: Partial<CompetitivePlayer>) => void;
  updateCompetitivePlayer: (id: string, updates: Partial<CompetitivePlayer>) => void;
  removeCompetitivePlayer: (id: string) => void;
  moveCompetitivePlayer: (id: string, direction: "left" | "right") => void;
  toggleCompetitiveSocial: (
    playerId: string,
    platform: SocialPlatform,
    enabled: boolean
  ) => void;
  updateCompetitiveSocialUrl: (
    playerId: string,
    platform: SocialPlatform,
    url: string
  ) => void;
  setCompetitiveRoster: (roster: CompetitivePlayer[]) => void;
  addCompetitiveEvent: (eventData?: Partial<CompetitiveEvent>) => void;
  updateCompetitiveEvent: (id: string, updates: Partial<CompetitiveEvent>) => void;
  removeCompetitiveEvent: (id: string) => void;
  moveCompetitiveEvent: (id: string, direction: "left" | "right") => void;
  setCompetitiveEvents: (events: CompetitiveEvent[]) => void;
  // Allies operations
  addAlly: (allyData?: Partial<AllyItem>) => void;
  updateAlly: (id: string, updates: Partial<AllyItem>) => void;
  removeAlly: (id: string) => void;
  moveAlly: (id: string, direction: "left" | "right") => void;
  toggleAllySocial: (
    id: string,
    platform: SocialPlatform,
    enabled: boolean
  ) => void;
  updateAllySocialUrl: (
    id: string,
    platform: SocialPlatform,
    url: string
  ) => void;
  setAlliesList: (allies: AllyItem[]) => void;
  generateAlliesTSCode: () => string;
  // Site Info operations
  updateSiteInfo: (updates: Partial<SiteInfo>) => void;
  updateTickerItems: (items: string[]) => void;
  // Auth & RBAC operations
  currentUser: BuilderUser | null;
  usersList: BuilderUser[];
  pendingUsersCount: number;
  isSuperAdmin: boolean;
  loginWithEmail: (email: string) => Promise<{ success: boolean; status: UserStatus; message?: string }>;
  logout: () => void;
  saveUsername: (username: string) => Promise<boolean>;
  approveUser: (userId: string, allowedSections: BuilderSectionKey[]) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  updateUserPermissions: (userId: string, allowedSections: BuilderSectionKey[]) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  syncUsersWithSupabase: () => Promise<void>;
  hasPermission: (section: BuilderSectionKey) => boolean;
  // State management
  resetToDefaults: () => void;
  importFromJSON: (jsonString: string) => boolean;
  exportToJSON: () => string;
  generateTeamTSCode: () => string;
  generateCompetitiveTSCode: () => string;
}

const BuilderContext = createContext<BuilderContextType | null>(null);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BuilderState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedEvents = (
          parsed.events && parsed.events.length > 0
            ? parsed.events
            : INITIAL_EVENTS
        ).map((e: EventItem) => ({
          ...e,
          rules: e.rules || DEFAULT_EVENT_RULES,
        }));

        return {
          ...INITIAL_BUILDER_STATE,
          ...parsed,
          events: mergedEvents,
          selectedEventId:
            parsed.selectedEventId || mergedEvents[0]?.id || "tourney-4",
          news:
            parsed.news && Array.isArray(parsed.news) && parsed.news.length > 0
              ? parsed.news
              : INITIAL_NEWS,
          competitiveRoster:
            parsed.competitiveRoster &&
            Array.isArray(parsed.competitiveRoster) &&
            parsed.competitiveRoster.length > 0
              ? parsed.competitiveRoster
              : INITIAL_COMPETITIVE_ROSTER,
          competitiveEvents:
            parsed.competitiveEvents &&
            Array.isArray(parsed.competitiveEvents) &&
            parsed.competitiveEvents.length > 0
              ? parsed.competitiveEvents
              : INITIAL_COMPETITIVE_EVENTS,
          allies:
            parsed.allies &&
            Array.isArray(parsed.allies) &&
            parsed.allies.length > 0
              ? parsed.allies
              : INITIAL_ALLIES,
          cloudflareConfig: {
            accountId: parsed.cloudflareConfig?.accountId?.trim() || DEFAULT_CLOUDFLARE_CONFIG.accountId,
            bucketName: parsed.cloudflareConfig?.bucketName?.trim() || DEFAULT_CLOUDFLARE_CONFIG.bucketName,
            accessKeyId: parsed.cloudflareConfig?.accessKeyId?.trim() || DEFAULT_CLOUDFLARE_CONFIG.accessKeyId,
            secretAccessKey: parsed.cloudflareConfig?.secretAccessKey?.trim() || DEFAULT_CLOUDFLARE_CONFIG.secretAccessKey,
            publicUrl: parsed.cloudflareConfig?.publicUrl?.trim() || DEFAULT_CLOUDFLARE_CONFIG.publicUrl,
            apiToken: parsed.cloudflareConfig?.apiToken?.trim() || DEFAULT_CLOUDFLARE_CONFIG.apiToken,
            accountHash: parsed.cloudflareConfig?.accountHash?.trim() || DEFAULT_CLOUDFLARE_CONFIG.accountHash,
          },
        };
      }
    } catch (e) {
      console.error("Error loading builder state from localStorage", e);
    }
    return INITIAL_BUILDER_STATE;
  });

  const [activeTab, setActiveTab] = useState<BuilderTab>("dashboard");

  // User list state
  const [usersList, setUsersList] = useState<BuilderUser[]>(() => {
    try {
      const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (savedUsers) {
        const parsed: BuilderUser[] = JSON.parse(savedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasSuper = parsed.some(
            (u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
          );
          if (!hasSuper) {
            return [...INITIAL_BUILDER_USERS, ...parsed];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading users list from localStorage", e);
    }
    return INITIAL_BUILDER_USERS;
  });

  // Current logged in user state
  const [currentUser, setCurrentUser] = useState<BuilderUser | null>(() => {
    try {
      const savedEmail = localStorage.getItem(AUTH_EMAIL_STORAGE_KEY);
      if (savedEmail) {
        const clean = savedEmail.trim().toLowerCase();
        if (clean === SUPER_ADMIN_EMAIL.toLowerCase()) {
          return INITIAL_BUILDER_USERS[0];
        }
        const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (savedUsers) {
          const list: BuilderUser[] = JSON.parse(savedUsers);
          const found = list.find((u) => u.email.toLowerCase() === clean);
          if (found) return found;
        }
      }
    } catch (e) {
      console.error("Error loading current user from localStorage", e);
    }
    return null;
  });

  // Sync users list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
    } catch (e) {
      console.error("Error saving users list to localStorage", e);
    }
  }, [usersList]);

  // Keep currentUser synced if its record in usersList changes
  useEffect(() => {
    if (!currentUser) return;
    const cleanEmail = currentUser.email.toLowerCase();
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return;
    }
    const fresh = usersList.find((u) => u.email.toLowerCase() === cleanEmail);
    if (
      fresh &&
      (fresh.status !== currentUser.status ||
        fresh.username !== currentUser.username ||
        fresh.allowedSections !== currentUser.allowedSections)
    ) {
      setCurrentUser(fresh);
    }
  }, [usersList, currentUser]);

  // Helper to persist single user to independent Supabase table 'builder_users'
  const persistUserToSupabase = async (user: BuilderUser) => {
    try {
      await supabase.from("builder_users").upsert({
        id: user.id,
        email: user.email.toLowerCase(),
        username: user.username || "",
        role: user.role,
        status: user.status,
        allowed_sections: user.allowedSections || [],
        created_at: user.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        approved_at: user.approvedAt || null,
      });
    } catch (err) {
      console.warn("[Builder Auth] Error al guardar usuario en builder_users:", err);
    }
  };

  // Helper to persist all users in Supabase builder_users table
  const saveUsersToRemote = async (listToSave: BuilderUser[]) => {
    try {
      const records = listToSave.map((u) => ({
        id: u.id,
        email: u.email.toLowerCase(),
        username: u.username || "",
        role: u.role,
        status: u.status,
        allowed_sections: u.allowedSections || [],
        created_at: u.createdAt || new Date().toISOString(),
        updated_at: u.updatedAt || new Date().toISOString(),
        approved_at: u.approvedAt || null,
      }));

      await supabase.from("builder_users").upsert(records);
    } catch (err) {
      console.warn("[Builder Auth] Error al sincronizar tabla builder_users:", err);
    }
  };

  // Fetch users directly from independent Supabase table 'builder_users'
  const syncUsersWithSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("builder_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mappedUsers: BuilderUser[] = data.map((row: any) => ({
          id: row.id || `user-${Date.now()}`,
          email: row.email,
          username: row.username || "",
          role: (row.role || "editor") as UserRole,
          status: (row.status || "pending") as UserStatus,
          allowedSections: Array.isArray(row.allowed_sections)
            ? (row.allowed_sections as BuilderSectionKey[])
            : [],
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
          approvedAt: row.approved_at || undefined,
        }));

        // Guarantee Superadmin is present
        if (!mappedUsers.some((u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {
          mappedUsers.unshift(INITIAL_BUILDER_USERS[0]);
          await persistUserToSupabase(INITIAL_BUILDER_USERS[0]);
        }

        setUsersList(mappedUsers);
      } else if (error) {
        // Fallback: If table builder_users does not exist yet, try to seed Superadmin
        console.warn("[Builder Auth] Intentando conectar con tabla builder_users:", error.message);
      }
    } catch (err) {
      console.warn("[Builder Auth] Error al obtener usuarios de Supabase:", err);
    }
  };

  useEffect(() => {
    syncUsersWithSupabase();
  }, []);

  // Polling for pending users so approval happens in real time without refreshing
  useEffect(() => {
    if (!currentUser || currentUser.status === "approved") return;

    const interval = setInterval(() => {
      syncUsersWithSupabase();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const loginWithEmail = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return {
        success: false,
        status: "rejected" as UserStatus,
        message: "Por favor, introduce un correo electrónico válido.",
      };
    }

    // Check if Superadmin
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      const superUser = INITIAL_BUILDER_USERS[0];
      setCurrentUser(superUser);
      localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, cleanEmail);
      return { success: true, status: "approved" as UserStatus };
    }

    // Check in users list
    const existing = usersList.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      setCurrentUser(existing);
      localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, cleanEmail);
      return { success: true, status: existing.status };
    }

    // Register new pending user
    const newUser: BuilderUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      username: "",
      role: "editor",
      status: "pending",
      allowedSections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextList = [...usersList, newUser];
    setUsersList(nextList);
    setCurrentUser(newUser);
    localStorage.setItem(AUTH_EMAIL_STORAGE_KEY, cleanEmail);
    await saveUsersToRemote(nextList);

    return { success: true, status: "pending" as UserStatus };
  };

  const logout = () => {
    localStorage.removeItem(AUTH_EMAIL_STORAGE_KEY);
    setCurrentUser(null);
    setActiveTab("dashboard");
  };

  const saveUsername = async (username: string): Promise<boolean> => {
    if (!currentUser) return false;
    const cleanName = username.trim();
    if (!cleanName) return false;

    const updatedCurrent: BuilderUser = {
      ...currentUser,
      username: cleanName,
      updatedAt: new Date().toISOString(),
    };

    setCurrentUser(updatedCurrent);

    const nextList = usersList.map((u) =>
      u.id === currentUser.id ||
      u.email.toLowerCase() === currentUser.email.toLowerCase()
        ? updatedCurrent
        : u
    );

    setUsersList(nextList);
    await saveUsersToRemote(nextList);
    return true;
  };

  const approveUser = async (
    userId: string,
    allowedSections: BuilderSectionKey[]
  ) => {
    const nextList = usersList.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          status: "approved" as UserStatus,
          allowedSections,
          approvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    setUsersList(nextList);
    await saveUsersToRemote(nextList);
  };

  const rejectUser = async (userId: string) => {
    const nextList = usersList.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          status: "rejected" as UserStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    setUsersList(nextList);
    await saveUsersToRemote(nextList);
  };

  const updateUserPermissions = async (
    userId: string,
    allowedSections: BuilderSectionKey[]
  ) => {
    const nextList = usersList.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          allowedSections,
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    setUsersList(nextList);
    await saveUsersToRemote(nextList);
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    const nextList = usersList.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          role,
          ...(role === "superadmin"
            ? { allowedSections: BUILDER_SECTIONS_LIST.map((s) => s.id) }
            : {}),
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    setUsersList(nextList);
    await saveUsersToRemote(nextList);
  };

  const deleteUser = async (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (target?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) return;

    const nextList = usersList.filter((u) => u.id !== userId);
    setUsersList(nextList);
    try {
      await supabase.from("builder_users").delete().eq("id", userId);
    } catch (err) {
      console.warn("[Builder Auth] Error al eliminar de builder_users:", err);
    }
  };

  const isSuperAdmin = Boolean(
    currentUser &&
      (currentUser.role === "superadmin" ||
        currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())
  );

  const hasPermission = (section: BuilderSectionKey): boolean => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    if (currentUser.status !== "approved") return false;
    return currentUser.allowedSections?.includes(section) || false;
  };

  const pendingUsersCount = usersList.filter((u) => u.status === "pending").length;

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Error saving builder state to localStorage", e);
    }
  }, [state]);

  const addMember = (groupId: string, memberData?: Partial<TeamMember>) => {
    setState((prev) => {
      const randomGradient =
        GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)]
          .value;
      const newMember: TeamMember = {
        id: `member-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: memberData?.name || "Nuevo Integrante",
        role: memberData?.role || "Staff / Rol",
        avatarType: memberData?.avatarType || "monogram",
        avatarImage: memberData?.avatarImage,
        gradient: memberData?.gradient || randomGradient,
        socials: memberData?.socials || { ...DEFAULT_MEMBER_SOCIALS },
      };

      return {
        ...prev,
        teamGroups: prev.teamGroups.map((g) =>
          g.id === groupId ? { ...g, members: [...g.members, newMember] } : g
        ),
      };
    });
  };

  const updateMember = (
    groupId: string,
    memberId: string,
    updates: Partial<TeamMember>
  ) => {
    setState((prev) => ({
      ...prev,
      teamGroups: prev.teamGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.map((m) =>
                m.id === memberId ? { ...m, ...updates } : m
              ),
            }
          : g
      ),
    }));
  };

  const removeMember = (groupId: string, memberId: string) => {
    setState((prev) => ({
      ...prev,
      teamGroups: prev.teamGroups.map((g) =>
        g.id === groupId
          ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
          : g
      ),
    }));
  };

  const moveMember = (
    groupId: string,
    memberId: string,
    direction: "left" | "right"
  ) => {
    setState((prev) => ({
      ...prev,
      teamGroups: prev.teamGroups.map((g) => {
        if (g.id !== groupId) return g;
        const index = g.members.findIndex((m) => m.id === memberId);
        if (index === -1) return g;
        const targetIndex = direction === "left" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= g.members.length) return g;

        const newMembers = [...g.members];
        const [removed] = newMembers.splice(index, 1);
        newMembers.splice(targetIndex, 0, removed);
        return { ...g, members: newMembers };
      }),
    }));
  };

  const toggleMemberSocial = (
    groupId: string,
    memberId: string,
    platform: SocialPlatform,
    enabled: boolean
  ) => {
    setState((prev) => ({
      ...prev,
      teamGroups: prev.teamGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.map((m) =>
                m.id === memberId
                  ? {
                      ...m,
                      socials: {
                        ...m.socials,
                        [platform]: {
                          url: m.socials[platform]?.url || "#",
                          enabled,
                        },
                      },
                    }
                  : m
              ),
            }
          : g
      ),
    }));
  };

  const updateMemberSocialUrl = (
    groupId: string,
    memberId: string,
    platform: SocialPlatform,
    url: string
  ) => {
    setState((prev) => ({
      ...prev,
      teamGroups: prev.teamGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.map((m) =>
                m.id === memberId
                  ? {
                      ...m,
                      socials: {
                        ...m.socials,
                        [platform]: {
                          enabled: m.socials[platform]?.enabled ?? true,
                          url,
                        },
                      },
                    }
                  : m
              ),
            }
          : g
      ),
    }));
  };

  const addGroup = (groupData?: Partial<TeamGroup>) => {
    const accents: GroupAccent[] = ["ember", "violet", "crimson", "emerald"];
    const randomAccent = accents[Math.floor(Math.random() * accents.length)];
    const newGroup: TeamGroup = {
      id: `group-${Date.now()}`,
      title: groupData?.title || "Nuevo Apartado",
      description:
        groupData?.description || "Descripción del nuevo grupo o apartado.",
      accent: groupData?.accent || randomAccent,
      members: groupData?.members || [],
    };
    setState((prev) => ({
      ...prev,
      teamGroups: [...prev.teamGroups, newGroup],
    }));
  };

  const updateGroup = (groupId: string, updates: Partial<TeamGroup>) => {
    setState((prev) => ({
      ...prev,
      teamGroups: prev.teamGroups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      ),
    }));
  };

  const removeGroup = (groupId: string) => {
    setState((prev) => ({
      ...prev,
      teamGroups: prev.teamGroups.filter((g) => g.id !== groupId),
    }));
  };

  const setTeamGroups = (groups: TeamGroup[]) => {
    setState((prev) => ({
      ...prev,
      teamGroups: groups,
    }));
  };

  const updateEvent = (eventId: string, updates: Partial<EventItem>) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId ? { ...e, ...updates } : e
      ),
    }));
  };

  const addEvent = (eventData?: Partial<EventItem>) => {
    const newId = `event-${Date.now()}`;
    const newEvent: EventItem = {
      id: newId,
      title: eventData?.title || "Nuevo Torneo",
      statusBadge: eventData?.statusBadge || "Próximamente",
      titlePrefix: eventData?.titlePrefix || "Overplay",
      titleMain: eventData?.titleMain || "Tournament",
      edition: eventData?.edition || "1",
      description:
        eventData?.description ||
        "Descripción del nuevo evento o torneo para la comunidad.",
      bannerImage: eventData?.bannerImage || "/images/tourney-banner.jpg",
      chips: eventData?.chips || ["5v5", "Comunidad"],
      registerButton: eventData?.registerButton || {
        text: "Inscribirse",
        url: "#inscripcion",
      },
      rulesButton: eventData?.rulesButton || {
        text: "Ver reglas",
        url: "#reglas",
      },
      infoItems: eventData?.infoItems || [
        { id: `info-${Date.now()}-1`, icon: "Radio", label: "Estado", value: "Próximamente" },
        { id: `info-${Date.now()}-2`, icon: "CalendarDays", label: "Fecha", value: "Por anunciar" },
        { id: `info-${Date.now()}-3`, icon: "Swords", label: "Formato", value: "5v5" },
        { id: `info-${Date.now()}-4`, icon: "Trophy", label: "Premios", value: "Por definir" },
      ],
      processPhases: eventData?.processPhases || [
        {
          id: `phase-${Date.now()}-1`,
          step: "01",
          icon: "FilePenLine",
          title: "Inscripción",
          text: "Registro de equipos.",
        },
        {
          id: `phase-${Date.now()}-2`,
          step: "02",
          icon: "Swords",
          title: "Competencia",
          text: "Enfrentamientos oficiales.",
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      events: [...prev.events, newEvent],
      selectedEventId: newId,
    }));
  };

  const removeEvent = (eventId: string) => {
    setState((prev) => {
      const filtered = prev.events.filter((e) => e.id !== eventId);
      return {
        ...prev,
        events: filtered,
        selectedEventId:
          prev.selectedEventId === eventId
            ? filtered[0]?.id || ""
            : prev.selectedEventId,
      };
    });
  };

  const setSelectedEventId = (eventId: string) => {
    setState((prev) => ({
      ...prev,
      selectedEventId: eventId,
    }));
  };

  const updateTourneyInfoItem = (
    eventId: string,
    itemId: string,
    updates: Partial<TourneyInfoItem>
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              infoItems: e.infoItems.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : e
      ),
    }));
  };

  const addTourneyInfoItem = (
    eventId: string,
    itemData?: Partial<TourneyInfoItem>
  ) => {
    const newItem: TourneyInfoItem = {
      id: `info-${Date.now()}`,
      icon: itemData?.icon || "Trophy",
      label: itemData?.label || "Nuevo Dato",
      value: itemData?.value || "Valor",
    };
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? { ...e, infoItems: [...e.infoItems, newItem] }
          : e
      ),
    }));
  };

  const removeTourneyInfoItem = (eventId: string, itemId: string) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              infoItems: e.infoItems.filter((item) => item.id !== itemId),
            }
          : e
      ),
    }));
  };

  const moveTourneyInfoItem = (
    eventId: string,
    itemId: string,
    direction: "left" | "right"
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) => {
        if (e.id !== eventId) return e;
        const index = e.infoItems.findIndex((item) => item.id === itemId);
        if (index === -1) return e;
        const targetIndex = direction === "left" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= e.infoItems.length) return e;
        const newItems = [...e.infoItems];
        const [removed] = newItems.splice(index, 1);
        newItems.splice(targetIndex, 0, removed);
        return { ...e, infoItems: newItems };
      }),
    }));
  };

  const updateProcessPhase = (
    eventId: string,
    phaseId: string,
    updates: Partial<ProcessPhase>
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              processPhases: e.processPhases.map((phase) =>
                phase.id === phaseId ? { ...phase, ...updates } : phase
              ),
            }
          : e
      ),
    }));
  };

  const addProcessPhase = (
    eventId: string,
    phaseData?: Partial<ProcessPhase>
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) => {
        if (e.id !== eventId) return e;
        const nextStepNumber = (e.processPhases.length + 1)
          .toString()
          .padStart(2, "0");
        const newPhase: ProcessPhase = {
          id: `phase-${Date.now()}`,
          step: phaseData?.step || nextStepNumber,
          icon: phaseData?.icon || "Swords",
          title: phaseData?.title || "Nueva Fase",
          text:
            phaseData?.text ||
            "Descripción de la nueva fase del proceso del torneo.",
        };
        return { ...e, processPhases: [...e.processPhases, newPhase] };
      }),
    }));
  };

  const removeProcessPhase = (eventId: string, phaseId: string) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              processPhases: e.processPhases.filter(
                (phase) => phase.id !== phaseId
              ),
            }
          : e
      ),
    }));
  };

  const moveProcessPhase = (
    eventId: string,
    phaseId: string,
    direction: "left" | "right"
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) => {
        if (e.id !== eventId) return e;
        const index = e.processPhases.findIndex((p) => p.id === phaseId);
        if (index === -1) return e;
        const targetIndex = direction === "left" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= e.processPhases.length) return e;
        const newPhases = [...e.processPhases];
        const [removed] = newPhases.splice(index, 1);
        newPhases.splice(targetIndex, 0, removed);
        return { ...e, processPhases: newPhases };
      }),
    }));
  };

  const addEventChip = (eventId: string, chipText: string) => {
    if (!chipText.trim()) return;
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId ? { ...e, chips: [...e.chips, chipText.trim()] } : e
      ),
    }));
  };

  const removeEventChip = (eventId: string, index: number) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? { ...e, chips: e.chips.filter((_, i) => i !== index) }
          : e
      ),
    }));
  };

  const updateEventChip = (
    eventId: string,
    index: number,
    value: string
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              chips: e.chips.map((c, i) => (i === index ? value : c)),
            }
          : e
      ),
    }));
  };

  const updateEventRules = (
    eventId: string,
    updates: Partial<EventRulesData>
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              rules: { ...e.rules, ...updates },
            }
          : e
      ),
    }));
  };

  const addRuleSection = (
    eventId: string,
    sectionData?: Partial<EventRuleSection>
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) => {
        if (e.id !== eventId) return e;
        const newSection: EventRuleSection = {
          id: `rule-${Date.now()}`,
          category: sectionData?.category || "Normativa General",
          title: sectionData?.title || `${e.rules.sections.length + 1}. Nueva Regla / Artículo`,
          description:
            sectionData?.description || "Descripción del apartado de reglas.",
          points: sectionData?.points || [
            "Punto o artículo específico de la normativa.",
          ],
        };
        return {
          ...e,
          rules: {
            ...e.rules,
            sections: [...e.rules.sections, newSection],
          },
        };
      }),
    }));
  };

  const updateRuleSection = (
    eventId: string,
    sectionId: string,
    updates: Partial<EventRuleSection>
  ) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              rules: {
                ...e.rules,
                sections: e.rules.sections.map((sec) =>
                  sec.id === sectionId ? { ...sec, ...updates } : sec
                ),
              },
            }
          : e
      ),
    }));
  };

  const removeRuleSection = (eventId: string, sectionId: string) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              rules: {
                ...e.rules,
                sections: e.rules.sections.filter(
                  (sec) => sec.id !== sectionId
                ),
              },
            }
          : e
      ),
    }));
  };

  const addNewsArticle = (articleData?: Partial<NewsArticle>) => {
    const newId = `news-${Date.now()}`;
    const newArticle: NewsArticle = {
      id: newId,
      category: articleData?.category || "overwatch",
      title: articleData?.title || "Nuevo Título de Noticia",
      subtitle:
        articleData?.subtitle ||
        "Subtítulo o resumen introductorio para captar el interés de los lectores.",
      excerpt:
        articleData?.excerpt ||
        "Extracto breve de la noticia para listados y vistas previas.",
      author: articleData?.author || "Staff Overplay",
      date:
        articleData?.date ||
        new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      image: articleData?.image || "/images/tourney-banner.jpg",
      readTime: articleData?.readTime || "3 min",
      content:
        articleData?.content ||
        `## Encabezado Principal de la Noticia

Escribe aquí el cuerpo del artículo con toda la información relevante.

### Detalles y Puntos Clave

- Punto importante número 1
- Punto importante número 2
- Punto importante número 3

> "Cita destacada o declaración del equipo sobre esta novedad."`,
      attachedImages: articleData?.attachedImages || [],
    };

    setState((prev) => ({
      ...prev,
      news: [newArticle, ...prev.news],
    }));
  };

  const updateNewsArticle = (id: string, updates: Partial<NewsArticle>) => {
    setState((prev) => ({
      ...prev,
      news: prev.news.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const removeNewsArticle = (id: string) => {
    setState((prev) => ({
      ...prev,
      news: prev.news.filter((item) => item.id !== id),
    }));
  };

  const setNewsList = (newsList: NewsArticle[]) => {
    setState((prev) => ({
      ...prev,
      news: newsList,
    }));
  };

  const updateWordpressUrl = (url: string) => {
    const cleanUrl = url.trim().replace(/\/+$/, "");
    try {
      localStorage.setItem("overplay_wordpress_url", cleanUrl);
    } catch (e) {
      console.error(e);
    }
    setState((prev) => ({
      ...prev,
      wordpressUrl: cleanUrl,
    }));
  };

  const updateCloudflareConfig = (updates: Partial<CloudflareConfig>) => {
    setState((prev) => ({
      ...prev,
      cloudflareConfig: {
        ...prev.cloudflareConfig,
        ...updates,
      },
    }));
  };

  const updateSiteInfo = (updates: Partial<SiteInfo>) => {
    setState((prev) => ({
      ...prev,
      siteInfo: { ...prev.siteInfo, ...updates },
    }));
  };

  const updateTickerItems = (items: string[]) => {
    setState((prev) => ({
      ...prev,
      tickerItems: items,
    }));
  };

  const resetToDefaults = () => {
    if (
      window.confirm(
        "¿Estás seguro de restablecer todos los datos a la configuración inicial por defecto?"
      )
    ) {
      setState(INITIAL_BUILDER_STATE);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const importFromJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.teamGroups && Array.isArray(parsed.teamGroups)) {
        setState(parsed);
        return true;
      }
    } catch (e) {
      console.error("Invalid JSON import", e);
    }
    return false;
  };

  const exportToJSON = () => {
    return JSON.stringify(state, null, 2);
  };

  const generateTeamTSCode = () => {
    const cleanGroups = state.teamGroups.map((group) => ({
      id: group.id,
      title: group.title,
      description: group.description,
      accent: group.accent,
      members: group.members.map((m) => {
        const activeSocials: Record<string, string> = {};
        for (const [platform, config] of Object.entries(m.socials)) {
          if (config.enabled && config.url && config.url !== "#") {
            activeSocials[platform] = config.url;
          } else if (config.enabled) {
            activeSocials[platform] = "#";
          }
        }

        return {
          name: m.name,
          role: m.role,
          gradient: m.gradient,
          ...(m.avatarType === "image" && m.avatarImage
            ? { image: m.avatarImage }
            : {}),
          socials: activeSocials,
        };
      }),
    }));

    return `/** Equipo humano detrás de Overplay: staff, arte y moderación. */\nimport type { SocialPlatform } from "./site";\n\nexport interface TeamMember {\n  name: string;\n  role: string;\n  image?: string;\n  socials?: Partial<Record<SocialPlatform, string>>;\n  gradient: string;\n}\n\nexport interface TeamGroup {\n  id: string;\n  title: string;\n  description: string;\n  accent: "ember" | "violet" | "crimson" | "emerald";\n  members: TeamMember[];\n}\n\nexport const TEAM_GROUPS: TeamGroup[] = ${JSON.stringify(
      cleanGroups,
      null,
      2
    )};\n`;
  };

  const addCompetitivePlayer = (playerData?: Partial<CompetitivePlayer>) => {
    setState((prev) => {
      const roster = prev.competitiveRoster || [];
      const nextNum = (roster.length + 1).toString().padStart(2, "0");
      const randomGradient =
        GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)].value;
      const newPlayer: CompetitivePlayer = {
        id: `player-${Date.now()}`,
        tag: playerData?.tag || nextNum,
        name: playerData?.name || "NUEVO JUGADOR",
        role: playerData?.role || "DPS Hitscan",
        position: playerData?.position || "Titular",
        avatarType: playerData?.avatarType || "monogram",
        avatarImage: playerData?.avatarImage,
        gradient: playerData?.gradient || randomGradient,
        events: playerData?.events || ["Tourney 3", "Clash Cup"],
        socials: playerData?.socials || { ...DEFAULT_MEMBER_SOCIALS },
      };
      return {
        ...prev,
        competitiveRoster: [...roster, newPlayer],
      };
    });
  };

  const updateCompetitivePlayer = (id: string, updates: Partial<CompetitivePlayer>) => {
    setState((prev) => ({
      ...prev,
      competitiveRoster: (prev.competitiveRoster || []).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const removeCompetitivePlayer = (id: string) => {
    setState((prev) => ({
      ...prev,
      competitiveRoster: (prev.competitiveRoster || []).filter((p) => p.id !== id),
    }));
  };

  const moveCompetitivePlayer = (id: string, direction: "left" | "right") => {
    setState((prev) => {
      const roster = [...(prev.competitiveRoster || [])];
      const index = roster.findIndex((p) => p.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= roster.length) return prev;
      const [removed] = roster.splice(index, 1);
      roster.splice(targetIndex, 0, removed);
      return { ...prev, competitiveRoster: roster };
    });
  };

  const toggleCompetitiveSocial = (
    playerId: string,
    platform: SocialPlatform,
    enabled: boolean
  ) => {
    setState((prev) => ({
      ...prev,
      competitiveRoster: (prev.competitiveRoster || []).map((p) =>
        p.id === playerId
          ? {
              ...p,
              socials: {
                ...p.socials,
                [platform]: {
                  url: p.socials[platform]?.url || "#",
                  enabled,
                },
              },
            }
          : p
      ),
    }));
  };

  const updateCompetitiveSocialUrl = (
    playerId: string,
    platform: SocialPlatform,
    url: string
  ) => {
    setState((prev) => ({
      ...prev,
      competitiveRoster: (prev.competitiveRoster || []).map((p) =>
        p.id === playerId
          ? {
              ...p,
              socials: {
                ...p.socials,
                [platform]: {
                  enabled: p.socials[platform]?.enabled ?? true,
                  url,
                },
              },
            }
          : p
      ),
    }));
  };

  const setCompetitiveRoster = (roster: CompetitivePlayer[]) => {
    setState((prev) => ({
      ...prev,
      competitiveRoster: roster,
    }));
  };

  const addCompetitiveEvent = (eventData?: Partial<CompetitiveEvent>) => {
    setState((prev) => {
      const events = prev.competitiveEvents || [];
      const newEvent: CompetitiveEvent = {
        id: `event-${Date.now()}`,
        name: eventData?.name || "Nuevo Torneo",
        year: eventData?.year || new Date().getFullYear().toString(),
        result: eventData?.result || "Participante",
        tier: eventData?.tier || "neutral",
        blurb: eventData?.blurb || "Breve descripción de la participación.",
      };
      return {
        ...prev,
        competitiveEvents: [...events, newEvent],
      };
    });
  };

  const updateCompetitiveEvent = (id: string, updates: Partial<CompetitiveEvent>) => {
    setState((prev) => ({
      ...prev,
      competitiveEvents: (prev.competitiveEvents || []).map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  };

  const removeCompetitiveEvent = (id: string) => {
    setState((prev) => ({
      ...prev,
      competitiveEvents: (prev.competitiveEvents || []).filter((e) => e.id !== id),
    }));
  };

  const moveCompetitiveEvent = (id: string, direction: "left" | "right") => {
    setState((prev) => {
      const events = [...(prev.competitiveEvents || [])];
      const index = events.findIndex((e) => e.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= events.length) return prev;
      const [removed] = events.splice(index, 1);
      events.splice(targetIndex, 0, removed);
      return { ...prev, competitiveEvents: events };
    });
  };

  const setCompetitiveEvents = (events: CompetitiveEvent[]) => {
    setState((prev) => ({
      ...prev,
      competitiveEvents: events,
    }));
  };

  const generateCompetitiveTSCode = () => {
    const cleanRoster = (state.competitiveRoster || []).map((p) => {
      const activeSocials: Record<string, string> = {};
      for (const [platform, config] of Object.entries(p.socials)) {
        if (config.enabled && config.url && config.url !== "#") {
          activeSocials[platform] = config.url;
        } else if (config.enabled) {
          activeSocials[platform] = "#";
        }
      }

      return {
        tag: p.tag,
        name: p.name,
        role: p.role,
        position: p.position,
        events: p.events,
        socials: activeSocials,
        gradient: p.gradient,
        ...(p.avatarType === "image" && p.avatarImage
          ? { image: p.avatarImage }
          : {}),
      };
    });

    const cleanEvents = (state.competitiveEvents || []).map((e) => ({
      name: e.name,
      year: e.year,
      result: e.result,
      tier: e.tier,
      blurb: e.blurb,
    }));

    return `/** Roster oficial de UL — división competitiva de Overplay — e historial de eventos. */\nimport type { SocialPlatform } from "./site";\n\nexport interface Player {\n  tag: string;\n  name: string;\n  role: string;\n  position: string;\n  events: string[];\n  socials: Partial<Record<SocialPlatform, string>>;\n  gradient: string;\n  image?: string;\n}\n\nexport const ROSTER: Player[] = ${JSON.stringify(
      cleanRoster,
      null,
      2
    )};\n\nexport interface TeamEvent {\n  name: string;\n  year: string;\n  result: string;\n  tier: "gold" | "silver" | "bronze" | "neutral";\n  blurb: string;\n}\n\nexport const TEAM_EVENTS: TeamEvent[] = ${JSON.stringify(
      cleanEvents,
      null,
      2
    )};\n`;
  };

  const addAlly = (allyData?: Partial<AllyItem>) => {
    setState((prev) => {
      const currentAllies = prev.allies || [];
      const randomGradient =
        GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)].value;
      const newAlly: AllyItem = {
        id: `ally-${Date.now()}`,
        name: allyData?.name || "Nuevo Aliado",
        badge: allyData?.badge || "Creador de contenido",
        description:
          allyData?.description ||
          "Descripción del creador, streamer o colaborador del proyecto.",
        link: allyData?.link || "https://twitch.tv",
        avatarType: allyData?.avatarType || "monogram",
        avatarImage: allyData?.avatarImage,
        gradient: allyData?.gradient || randomGradient,
        socials: allyData?.socials || { ...DEFAULT_MEMBER_SOCIALS },
      };

      return {
        ...prev,
        allies: [...currentAllies, newAlly],
      };
    });
  };

  const updateAlly = (id: string, updates: Partial<AllyItem>) => {
    setState((prev) => ({
      ...prev,
      allies: (prev.allies || []).map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  };

  const removeAlly = (id: string) => {
    setState((prev) => ({
      ...prev,
      allies: (prev.allies || []).filter((a) => a.id !== id),
    }));
  };

  const moveAlly = (id: string, direction: "left" | "right") => {
    setState((prev) => {
      const allies = [...(prev.allies || [])];
      const index = allies.findIndex((a) => a.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= allies.length) return prev;
      const [removed] = allies.splice(index, 1);
      allies.splice(targetIndex, 0, removed);
      return { ...prev, allies };
    });
  };

  const toggleAllySocial = (
    id: string,
    platform: SocialPlatform,
    enabled: boolean
  ) => {
    setState((prev) => ({
      ...prev,
      allies: (prev.allies || []).map((a) =>
        a.id === id
          ? {
              ...a,
              socials: {
                ...a.socials,
                [platform]: {
                  url: a.socials[platform]?.url || "#",
                  enabled,
                },
              },
            }
          : a
      ),
    }));
  };

  const updateAllySocialUrl = (
    id: string,
    platform: SocialPlatform,
    url: string
  ) => {
    setState((prev) => ({
      ...prev,
      allies: (prev.allies || []).map((a) =>
        a.id === id
          ? {
              ...a,
              socials: {
                ...a.socials,
                [platform]: {
                  enabled: a.socials[platform]?.enabled ?? true,
                  url,
                },
              },
            }
          : a
      ),
    }));
  };

  const setAlliesList = (allies: AllyItem[]) => {
    setState((prev) => ({
      ...prev,
      allies,
    }));
  };

  const generateAlliesTSCode = () => {
    const cleanAllies = (state.allies || []).map((a) => {
      const activeSocials: Record<string, string> = {};
      for (const [platform, config] of Object.entries(a.socials)) {
        if (config.enabled && config.url && config.url !== "#") {
          activeSocials[platform] = config.url;
        } else if (config.enabled) {
          activeSocials[platform] = "#";
        }
      }

      return {
        name: a.name,
        badge: a.badge,
        description: a.description,
        link: a.link,
        gradient: a.gradient,
        ...(a.avatarType === "image" && a.avatarImage
          ? { image: a.avatarImage }
          : {}),
        socials: activeSocials,
      };
    });

    return `/** Aliados y creadores de contenido que apoyan el proyecto. */\nimport type { SocialPlatform } from "./site";\n\nexport interface Ally {\n  name: string;\n  badge: string;\n  description: string;\n  socials: Partial<Record<SocialPlatform, string>>;\n  link: string;\n  gradient: string;\n  image?: string;\n}\n\nexport const ALLIES: Ally[] = ${JSON.stringify(
      cleanAllies,
      null,
      2
    )};\n`;
  };

  return (
    <BuilderContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        addMember,
        updateMember,
        removeMember,
        moveMember,
        addGroup,
        updateGroup,
        removeGroup,
        setTeamGroups,
        toggleMemberSocial,
        updateMemberSocialUrl,
        updateEvent,
        addEvent,
        removeEvent,
        setSelectedEventId,
        updateTourneyInfoItem,
        addTourneyInfoItem,
        removeTourneyInfoItem,
        moveTourneyInfoItem,
        updateProcessPhase,
        addProcessPhase,
        removeProcessPhase,
        moveProcessPhase,
        addEventChip,
        removeEventChip,
        updateEventChip,
        updateEventRules,
        addRuleSection,
        updateRuleSection,
        removeRuleSection,
        addNewsArticle,
        updateNewsArticle,
        removeNewsArticle,
        setNewsList,
        updateCloudflareConfig,
        updateWordpressUrl,
        addCompetitivePlayer,
        updateCompetitivePlayer,
        removeCompetitivePlayer,
        moveCompetitivePlayer,
        toggleCompetitiveSocial,
        updateCompetitiveSocialUrl,
        setCompetitiveRoster,
        addCompetitiveEvent,
        updateCompetitiveEvent,
        removeCompetitiveEvent,
        moveCompetitiveEvent,
        setCompetitiveEvents,
        addAlly,
        updateAlly,
        removeAlly,
        moveAlly,
        toggleAllySocial,
        updateAllySocialUrl,
        setAlliesList,
        generateAlliesTSCode,
        updateSiteInfo,
        updateTickerItems,
        currentUser,
        usersList,
        pendingUsersCount,
        isSuperAdmin,
        loginWithEmail,
        logout,
        saveUsername,
        approveUser,
        rejectUser,
        updateUserPermissions,
        updateUserRole,
        deleteUser,
        syncUsersWithSupabase,
        hasPermission,
        resetToDefaults,
        importFromJSON,
        exportToJSON,
        generateTeamTSCode,
        generateCompetitiveTSCode,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const ctx = useContext(BuilderContext);
  if (!ctx) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return ctx;
}
