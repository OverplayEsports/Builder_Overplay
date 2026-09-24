import { useState, useEffect } from "react";
import { BuilderProvider, useBuilder } from "./context/BuilderContext";
import { BuilderNavbar } from "./components/builder/BuilderNavbar";
import { DashboardOverview } from "./components/builder/DashboardOverview";
import { AboutEditor } from "./components/builder/AboutEditor";
import { EventsEditor } from "./components/builder/EventsEditor";
import { CompetitiveEditor } from "./components/builder/CompetitiveEditor";
import { NewsEditor } from "./components/builder/NewsEditor";
import { AlliesEditor } from "./components/builder/AlliesEditor";
import { HeroEditor } from "./components/builder/HeroEditor";
import { TickerEditor } from "./components/builder/TickerEditor";
import { CtaEditor } from "./components/builder/CtaEditor";
import { RegistrationsEditor } from "./components/builder/RegistrationsEditor";
import { EmailTemplateEditor } from "./components/builder/EmailTemplateEditor";
import { UsersManagementEditor } from "./components/builder/UsersManagementEditor";
import { AuthGate } from "./components/auth/AuthGate";
import { SetUsernameModal } from "./components/auth/SetUsernameModal";
import type { BuilderSectionKey } from "./types/builder";

function MainBuilderContent() {
  const { activeTab, setActiveTab, currentUser, hasPermission, isSuperAdmin } = useBuilder();

  // Security route protection: if user is on a tab they don't have permission for, redirect to dashboard
  useEffect(() => {
    if (activeTab !== "dashboard" && activeTab !== "code" && activeTab !== "users") {
      if (!hasPermission(activeTab as BuilderSectionKey)) {
        setActiveTab("dashboard");
      }
    }
  }, [activeTab, hasPermission, setActiveTab]);

  // If user is not logged in or status is pending/rejected, show AuthGate
  if (!currentUser || currentUser.status !== "approved") {
    return <AuthGate />;
  }

  return (
    <div className="relative min-h-screen bg-[#050506] font-sans text-white antialiased">
      {/* Noise texture */}
      <div aria-hidden className="noise-overlay" />

      {/* Onboarding Username Modal (shown if approved user has no username set) */}
      <SetUsernameModal />

      {/* Top Builder Navigation */}
      <BuilderNavbar
        onOpenUsersManagement={isSuperAdmin ? () => setActiveTab("users") : undefined}
      />

      {/* Main Content */}
      <main className="relative z-10">
        {activeTab === "dashboard" && (
          <DashboardOverview
            onOpenUsersManagement={isSuperAdmin ? () => setActiveTab("users") : undefined}
          />
        )}
        {activeTab === "about" && hasPermission("about") && <AboutEditor />}
        {activeTab === "events" && hasPermission("events") && <EventsEditor />}
        {activeTab === "competitive" && hasPermission("competitive") && <CompetitiveEditor />}
        {activeTab === "news" && hasPermission("news") && <NewsEditor />}
        {activeTab === "allies" && hasPermission("allies") && <AlliesEditor />}
        {activeTab === "hero" && hasPermission("hero") && <HeroEditor />}
        {activeTab === "ticker" && hasPermission("ticker") && <TickerEditor />}
        {activeTab === "cta" && hasPermission("cta") && <CtaEditor />}
        {activeTab === "registrations" && hasPermission("registrations") && <RegistrationsEditor />}
        {activeTab === "email-template" && hasPermission("email-template") && <EmailTemplateEditor />}
        {activeTab === "users" && isSuperAdmin && <UsersManagementEditor />}
      </main>
    </div>
  );
}


export default function App() {
  return (
    <BuilderProvider>
      <MainBuilderContent />
    </BuilderProvider>
  );
}

