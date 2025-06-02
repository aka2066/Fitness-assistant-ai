'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { useAuth } from '../app/providers/AuthProvider';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

export default function Navigation() {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const fetchUserName = async () => {
      if (!user?.userId) {
        setUserName('');
        return;
      }

      try {
        const listQuery = `
          query ListUserProfiles($filter: ModelUserProfileFilterInput) {
            listUserProfiles(filter: $filter) {
              items {
                id
                userId
              }
            }
          }
        `;
        
        const result: any = await client.graphql({
          query: listQuery,
          variables: {
            filter: {
              userId: {
                eq: user.userId
              }
            }
          }
        });

        const profiles = result.data?.listUserProfiles?.items || [];
        
        if (profiles.length > 0 && profiles[0].name) {
          setUserName(profiles[0].name);
        } else {
          // Fallback to username if no profile name
          setUserName(user.username);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName(user.username || 'User');
      }
    };

    fetchUserName();
  }, [user]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    if (user?.signOut) {
      await user.signOut();
    }
    handleClose();
  };

  const displayName = userName || user?.username || 'User';

  return (
    <AppBar position="static" sx={{ mb: 2 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Fitness Assistant
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              Welcome, {displayName}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>
                <Typography component="a" href="/profile" sx={{ textDecoration: 'none', color: 'inherit' }}>
                  Profile
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
} 