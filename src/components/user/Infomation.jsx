import {
  Menu,
  VStack,
  Text,
  Avatar,
  Portal
} from '@chakra-ui/react';
import { 
  // LuSettings , 
  LuLogOut , 
  LuUser , 
} from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { toaster } from '@/components/ui/toaster';
import { useAtom } from 'jotai';
import { logoutAtom } from "@/atoms/authAtom";
import { userAtom } from "@/atoms/userAtom";

export const Infomation = ( ) => {

  const [user, setUser] = useAtom(userAtom);

  const navigate = useNavigate()
  const [, logout] = useAtom(logoutAtom)

  const handleLogout = async () => {
      try {
        await logout();
        localStorage.removeItem('accessToken');
        setUser(null);
        toaster.create({
          title: 'Logout Successful',
          description: 'You have been logged out.',
          type: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
      } catch (error) {
        toaster.create({
          title: 'Logout Error',
          description: error.response?.data?.message || 'Unable to logout. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
  return (
    <Menu.Root>
      <Menu.Trigger
        _hover={{ transform: 'scale(1.05)' }}
        transition="all 0.2s"
      >
        <Avatar.Root
          size="md" 
          cursor="pointer"
          shape="rounded"
        >
          <Avatar.Fallback name={user?.fullName}/>
          <Avatar.Image />
        </Avatar.Root>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner 
          boxShadow="xl" 
          borderRadius="md"
          minWidth="250px"
        >
          <Menu.Content>
            <VStack 
              gap={0}
              px={4} 
              mb={1} 
              align="start"
            >
              <Text fontWeight="bold"> {user?.fullName}</Text>
              <Text fontSize="sm" color="gray.500">{user?.email}</Text>
            </VStack>
            
            
            <Menu.ItemGroup title="Profile">
              <Menu.Item 
                _hover={{ 
                  bg: 'blue.50', 
                  color: 'blue.500' 
                }}
                onClick={() => navigate('/profile')}
              >
                <LuUser size={16} />
                Profile
              </Menu.Item>
            </Menu.ItemGroup>
            <Menu.ItemGroup title="Account">
              {/* <Menu.Item 
                _hover={{ 
                  bg: 'blue.50', 
                  color: 'blue.500' 
                }}
              >
                <LuSettings size={16} />
                Settings
              </Menu.Item> */}
              <Menu.Item 

                icon={<LuLogOut size={16} />}
                color="red.500"
                _hover={{ 
                  bg: 'red.600',  
                  color: 'black' 
                }}
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.ItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>

  );
};
