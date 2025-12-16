import {
  Box,
  Divider,
  Drawer,
  Icon,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { Link, useLocation } from "react-router";
import { sidebarConfig, hasAccess } from "src/config/routes";
import { useAuth } from "src/stores";

function Sidebar({ ...props }) {
  const {
    user: { role },
  } = useAuth();

  const sidebarLinks = useMemo(() => {
    return Object.entries(sidebarConfig).map(([sectionName, sectionData]) => {
      const { icon: sectionIcon, routes } = sectionData;

      const links = routes.reduce((acc, { label, href, icon, authRole }) => {
        if (hasAccess(role, authRole)) {
          acc.push(<SidebarItem key={label} label={label} href={href} icon={icon} />);
        }
        return acc;
      }, []);

      if (links.length === 0) return null;

      return (
        <div key={sectionName}>
          <Divider />
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 30 }}>
                <Icon>{sectionIcon}</Icon>
              </ListItemIcon>
              <Typography sx={{ fontWeight: "500" }}>{sectionName}</Typography>
            </ListItem>
            {links}
          </List>
        </div>
      );
    });
  }, [role]);

  return (
    <Drawer {...props}>
      <Stack className="flex-container">
        <Toolbar variant="dense" />
        <Box sx={{ overflow: "auto" }} className="flex-container">
          {sidebarLinks}
        </Box>
      </Stack>
    </Drawer>
  );
}

function SidebarItem({ label, /* icon, */ href }) {
  const location = useLocation();
  // logger.log(location)?
  const pattern = new RegExp(`^/admin/${href}(?:/\\d+)?/?$`);

  const current
    = Boolean(pattern.test(location.pathname) && href)
      || (location.pathname === "/admin/" && href === "/records");

  // logger.log({ label, href, pathname, current });
  return (
    <ListItemLink selected={Boolean(current)} href={href}>
      <ListItemText>{label}</ListItemText>
    </ListItemLink>
  );
}

function ListItemLink(props) {
  return (
    <ListItemButton
      disabled={!props.href}
      component={props.href ? Link : "div"}
      to={`/admin/${props.href}`}
      {...props}
    />
  );
}

export default Sidebar;
