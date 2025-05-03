/* eslint-disable react/prop-types */
import { Box, VStack, Text } from "@chakra-ui/react";
import { NavLink } from 'react-router';

const SidebarUser = ({ onItemClick }) => {
  const navLinkStyle = ({ isActive }) => ({
    fontWeight: isActive ? 'bold' : 'normal',
    backgroundColor: isActive ? '#EDF2F7' : 'transparent',
    padding: '8px',
    borderRadius: '8px',
    textDecoration: 'none',
  });

  return (
    <Box
      h="100vh"
      w="220px"
      borderRight="1px solid"
      borderColor="gray.200"
      bg="white"
      p={4}
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="xl" fontWeight="bold" textAlign="center">Video App</Text>

        <NavLink to="/video/create" style={navLinkStyle} onClick={onItemClick}>
          Create Video
        </NavLink>
        {/* <NavLink to="/video/test" style={navLinkStyle} onClick={onItemClick}>
          Test
        </NavLink> */}

      </VStack>
    </Box>
  );
};

export default SidebarUser;
