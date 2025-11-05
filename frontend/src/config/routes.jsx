export const ROLE_HIERARCHY = ["intern", "staff", "administrator"];

export const appConfig = {
  Collections: {
    icon: "library_books",
    routes: [
      {
        path: "collections",
        component: "Collections",
        sidebar: {
          label: "Manage Collections",
          icon: "",
        },
      },
      {
        path: "collections/new",
        sidebar: {
          label: "New Collection",
          icon: "",
        },
      },
      {
        path: "collections/:id",
        component: "Collection",
      },
    ],
  },

  Records: {
    icon: "description",
    routes: [
      {
        path: "",
        redirect: "/admin/records",
      },
      {
        path: "search",
        component: "PublicSearch",
        sidebar: {
          label: "Search Records",
          icon: "",
        },
      },
      {
        path: "records",
        component: "Records",
        sidebar: {
          label: "Manage Records",
          icon: "",
        },
      },
      {
        path: "records/new",
        sidebar: {
          label: "New Record",
          icon: "",
        },
      },
      {
        path: "records/table",
        component: "Table",
        authRole: "staff",
        sidebar: {
          label: "Table View",
          icon: "",
        },
      },
      {
        path: "records/:id",
        component: "Record",
        props: { showForm: true },
      },
    ],
  },

  "Site Management": {
    icon: "settings",
    routes: [
      {
        path: "site/settings",
        component: "SiteSettings",
        authRole: "staff",
        sidebar: {
          label: "Site Settings",
          icon: "",
        },
      },
      {
        path: "site/featured-records",
        component: "Collection",
        authRole: "staff",
        props: { id: 0, mode: "featured_records" },
        sidebar: {
          label: "Manage Featured Records",
          icon: "",
        },
      },
      {
        path: "site/featured-collections",
        component: "Collection",
        authRole: "staff",
        props: { id: 0, mode: "featured_collections" },
        sidebar: {
          label: "Manage Featured Collections",
          icon: "",
        },
      },
      {
        path: "site/edit-list-values",
        component: "EditLists",
        authRole: "staff",
        sidebar: {
          label: "Edit List Values",
          icon: "",
        },
      },
      {
        // path: "export-collections",
        authRole: "staff",
        sidebar: {
          label: "Export Collections",
          icon: "",
        },
      },
      {
        // path: "find-duplicates",
        authRole: "staff",
        sidebar: {
          label: "Find Duplicate Records",
          icon: "",
        },
      },
      {
        path: "site/review-changes",
        component: "ReviewChanges",
        authRole: "administrator",
        sidebar: {
          label: "Review Changes",
          icon: "",
        },
      },
    ],
  },

  Admin: {
    icon: "admin_panel_settings",
    routes: [
      {
        path: "relationships",
        component: "Relationships",
        authRole: "administrator",
        sidebar: {
          label: "Update Unknown Relationships",
          icon: "",
        },
      },
      {
        path: "admin/users",
        component: "Users",
        authRole: "staff",
        sidebar: {
          label: "Manage Users",
          icon: "",
        },
      },
      {
        path: "admin/publish-site",
        component: "PublishSite",
        authRole: "administrator",
        sidebar: {
          label: "Publish/Restore Live Site",
          icon: "",
        },
      },
      {
        path: "relationships/:skip",
        component: "Relationships",
        authRole: "administrator",
      },
    ],
  },

  // Routes that don't appear in navigation
  Hidden: {
    routes: [
      {
        path: "login",
        component: "Login",
        public: true,
      },
      {
        path: "forbidden",
        component: "Forbidden",
        public: true,
      },
      // {
      //   path: "search",
      //   component: "Search",
      //   public: true,
      // },
    ],
  },
};

export function hasAccess(userRole, requiredRole) {
  if (!requiredRole) return true;
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  return userLevel >= requiredLevel;
}

export const sidebarConfig = {};

export const routes = Object.entries(appConfig).reduce((acc, [sectionName, section]) => {
  const sectionRoutes = [];
  (section.routes || []).forEach((routeConfig) => {
    const { path, sidebar, ...config } = routeConfig;
    if (config.component || config.redirect) {
      acc[path] = [path, config];
    }
    if (sidebar) {
      const { authRole } = config;
      const { label, icon } = sidebar;
      sectionRoutes.push({
        label,
        icon,
        href: path,
        authRole,
      });
    }
  });
  if (sectionRoutes.length > 0) {
    sidebarConfig[sectionName] = {
      icon: section.icon,
      routes: sectionRoutes,
    };
  }
  return acc;
}, {});
