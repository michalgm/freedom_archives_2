import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "src/stores";

const ROLE_HIERARCHY = ["intern", "staff", "administrator"];

const sideBarConfig = {
  Collections: [
    { label: "Manage Collections", icon: "", href: "/collections" },
    { label: "New Collection", icon: "", href: "/collections/new" },
  ],
  Records: [
    { label: "Search Records", icon: "", href: "/search" },
    { label: "Manage Records", icon: "", href: "/records" },
    { label: "New Record", icon: "", href: "/records/new" },
    { label: "Table View", icon: "", href: "/records/table" },
  ],
  "Site Management": [
    { label: "Site Settings", icon: "", href: "/site/settings", authRole: "staff" },
    { label: "Manage Featured Records", icon: "", href: "/records/featured", authRole: "staff" },
    {
      label: "Manage Featured Collections",
      icon: "",
      href: "/collections/featured",
      authRole: "staff",
    },
    { label: "Edit List Values", icon: "", href: "/site/edit-list-values", authRole: "staff" },
    { label: "Export Collections", icon: "", authRole: "staff" },
    { label: "Find Duplicate Records", icon: "", authRole: "staff" },
    { label: "Review Changes", icon: "", href: "/site/review-changes", authRole: "administrator" },
  ],
  Admin: [
    { label: "Update Unknown Relationships", icon: "", href: "/relationships", authRole: "administrator" },
    // { label: "Update Thumbnails", icon: "",  },
    // { label: "Update Keywords", icon: "",  },
    { label: "Manage Users", href: "/admin/users", authRole: "staff" },
    { label: "Publish/Restore Live Site", href: "/admin/publish-site", authRole: "administrator" },
  ],
};

function Sidebar({ ...props }) {
  const {
    user: { role },
  } = useAuth();
  const roleLevel = ROLE_HIERARCHY.indexOf(role);

  const sidebarLinks = useMemo(() => {
    return Object.keys(sideBarConfig).map((title) => {
      const links = sideBarConfig[title].reduce((acc, { label, href, icon, authRole }) => {
        {
          if (roleLevel >= ROLE_HIERARCHY.indexOf(authRole)) {
            acc.push(<SidebarItem key={label} label={label} href={href} icon={icon} />);
          }
          return acc;
        }
      }, []);
      if (links.length === 0) return null;

      return (
        <div key={title}>
          <Divider />
          <List dense>
            <ListItem>
              <Typography variant="h6">{title}</Typography>
            </ListItem>
            {links}
          </List>
        </div>
      );
    });
  }, [roleLevel]);

  return (
    <Drawer {...props}>
      <Stack className="FlexContainer">
        <Toolbar />
        <Box sx={{ overflow: "auto" }} className="FlexContainer">
          {sidebarLinks}
        </Box>
      </Stack>
    </Drawer>
  );
}

function SidebarItem({ label, /* icon, */ href }) {
  const location = useLocation();
  // logger.log(location)?
  const pattern = new RegExp(`^${href}(?:/\\d+)?/?$`);
  const current =
    Boolean(pattern.test(location.pathname) && href) || (location.pathname === "/" && href === "/records");

  // logger.log({ label, href, pathname, current });
  return (
    <ListItemLink selected={Boolean(current)} href={href}>
      <ListItemText>{label}</ListItemText>
    </ListItemLink>
  );
}

function ListItemLink(props) {
  return <ListItemButton disabled={!props.href} component={props.href ? Link : "div"} to={props.href} {...props} />;
}

export default Sidebar;
