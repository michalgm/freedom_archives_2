import React from 'react';
import {
  Divider,
  List,
  ListItem,
  Typography,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import {
  getDrawerSidebar,
  getSidebarContent,
  getCollapseBtn,
} from '@mui-treasury/layout';

import styled from 'styled-components';
import { useRouteMatch } from 'react-router-dom';

const sideBarConfig = {
  Collections: [
    { label: 'Manage Collections', icon: '', href: '' },
    { label: 'New Collection', icon: '', href: '' },
    { label: 'Manage Featured Collections', icon: '', href: '' },
  ],
  Records: [
    { label: 'Manage Records', icon: '', href: '/records' },
    { label: 'New Record', icon: '', href: '' },
    { label: 'Manage Featured Records', icon: '', href: '' },
    { label: 'Update Unknown Relationships', icon: '', href: '/relationships' },
  ],
  Admin: [{ label: 'Manage Users' }, { label: 'Publish/Restore Live Site' }],
};

const DrawerSidebar = getDrawerSidebar(styled);
const SidebarContent = getSidebarContent(styled);
const CollapseBtn = getCollapseBtn(styled);

function Sidebar() {
  return (
    <DrawerSidebar sidebarId={'primarySidebar'}>
      <SidebarContent>
        {Object.keys(sideBarConfig).map(title => {
          return (
            <div key={title}>
              <Divider />
              <List>
                <ListItem>
                  <Typography variant="h5">{title}</Typography>
                </ListItem>
                {sideBarConfig[title].map(({ label, href, icon }) => (
                  <SidebarItem
                    key={label}
                    label={label}
                    href={href}
                    icon={icon}
                  />
                ))}
              </List>
            </div>
          );
        })}
      </SidebarContent>
      <CollapseBtn />
    </DrawerSidebar>
  );
}

function SidebarItem({ label, icon, href }) {
  const current = Boolean(useRouteMatch(href) !== null && href);
  return (
    <ListItemLink button selected={current} href={href}>
      <ListItemText>{label}</ListItemText>
    </ListItemLink>
  );
}

function ListItemLink(props) {
  return (
    <ListItem
      button
      disabled={!Boolean(props.href)}
      component={props.href ? 'a' : 'div'}
      {...props}
    />
  );
}

export default Sidebar;