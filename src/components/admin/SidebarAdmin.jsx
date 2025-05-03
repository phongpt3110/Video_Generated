/* eslint-disable react/prop-types */
import { Box, Flex, Heading, VStack, Text } from "@chakra-ui/react";
import { NavLink, useNavigate } from "react-router";
import { FaTable, FaUserFriends, FaVideo, FaSignOutAlt, FaHome } from "react-icons/fa";
import { useSetAtom } from "jotai";
import { logoutAtom } from "@/atoms/authAtom"; // đường dẫn import tùy cấu trúc dự án

const SidebarAdmin = ({ onItemClick }) => {
  const logout = useSetAtom(logoutAtom);
  const navigate = useNavigate();

  const NavItem = ({ icon, label, to }) => (
    <Box w="full">
      <NavLink 
        to={to} 
        onClick={onItemClick} 
        end
        style={({isActive}) => ({
          textDecoration: 'none',
          color: isActive ? '#2B6CB0' : "inherit" 
        })}

      >
        {({isActive}) => (
          <Flex
            align="center"
            gap={3}
            px={4}
            py={3}
            borderRadius="md"
            shadow='xs'
            bg={isActive ? 'gray.200' : 'transparent'} 
            fontWeight={isActive ? 'bold' : 'normal'}
            _hover={{ bg: 'gray.200' }}
            w="full"
          >
            {icon}
            <Text>{label}</Text>
          </Flex>
        )}
      </NavLink>
    </Box>
  );

  const LogoutItem = ({ icon, label }) => (
    <Box w="full">
      <Flex
        align="center"
        gap={3}
        px={4}
        py={3}
        borderRadius="md"
        _hover={{ bg: 'gray.200', cursor: 'pointer' }}
        w="full"
        onClick={async () => {
          await logout();         // Gọi logoutAtom
          navigate("/login");     // Điều hướng về trang login
        }}
      >
        {icon}
        <Text>{label}</Text>
      </Flex>
    </Box>
  );

  return (
    <Box
      w="200px"
      bg="white"
      color="black"
      m={4}
      borderRadius="4xl"
      p={4}
    >
      <Heading size="xl" mb={10} textAlign="center">
        VIDEO ADMIN
      </Heading>
      <VStack spacing={1} align="stretch">
        <NavItem icon={<FaTable />} label="Dashboard" to="/admin" />
        <NavItem icon={<FaUserFriends />} label="Tài khoản" to="/admin/users" />
        <NavItem icon={<FaVideo />} label="Video" to="/admin/videos" />
        <NavItem icon={< FaHome/>} label="Home" to="/video/create" />
        <LogoutItem icon={<FaSignOutAlt />} label="Log Out" />
      </VStack>
    </Box>
  );
};

export default SidebarAdmin;
