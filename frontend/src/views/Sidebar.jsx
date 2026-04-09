import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Icon from "@mui/material/Icon";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import { Link, useLocation, useMatch } from "react-router";
import { hasAccess, sidebarConfig } from "src/config/routes";
import { useAuth } from "src/stores";

function Sidebar({ ...props }) {
  const {
    user: { role },
  } = useAuth();

  const sidebarLinks = useMemo(() => {
    return Object.entries(sidebarConfig).map(([sectionName, sectionData]) => {
      const { icon: sectionIcon, routes } = sectionData;

      const links = routes.reduce((acc, { label, sidebarPath, pattern, icon, authRole }) => {
        if (hasAccess(role, authRole)) {
          acc.push(<SidebarItem key={label} label={label} pattern={pattern} href={sidebarPath} icon={icon} />);
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

function SidebarItem({ label, /* icon, */ href, pattern }) {
  const location = useLocation();
  // logger.log(location)?
  let current = Boolean(useMatch(typeof pattern === "string" ? `/admin/${pattern}` : ""));
  if (!current && pattern instanceof RegExp) {
    current = pattern.test(location.pathname) ? { pathname: location.pathname } : null;
  }

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
