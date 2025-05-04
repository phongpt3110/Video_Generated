// import {
//   Box,
//   VStack,
//   Flex,
//   Text,
//   Button,
//   Spinner,
//   Input,
//   FormControl,
//   FormLabel,
//   FormErrorMessage,
//   useDisclosure,
//   Dialog,
//   Portal,
//   Heading,
//   InputGroup,
//   InputRightElement,
//   Switch,
// } from "@chakra-ui/react";

// import { Tooltip } from "@/components/ui/tooltip";
// import { BiUser, BiEnvelope, BiLock, BiShow, BiHide } from "react-icons/bi";
// import { MdDelete } from "react-icons/md";
// import { Toaster, toaster } from '@/components/ui/toaster';

// import { useState, useEffect } from "react";
// import { useNavigate } from 'react-router';
// import { Infomation } from "@/components/user/Infomation";
// import api from "@/api";
// import { useAtom } from "jotai";
// import { accessTokenAtom, logoutAtom } from "@/atoms/authAtom.js";
// import { userAtom } from "@/atoms/userAtom";

// const ProfilePage = () => {
//   const [, setUser] = useAtom(userAtom);
//   const [accessToken] = useAtom(accessTokenAtom);
//   const [, logout] = useAtom(logoutAtom);
//   const [loading, setLoading] = useState(false);
//   const [updating, setUpdating] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
//   const { isOpen, onOpen, onClose } = useDisclosure();
//   const navigate = useNavigate();

//   // Form state
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     fullName: '',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: '',
//     changePassword: false
//   });

//   // Form errors
//   const [errors, setErrors] = useState({});

//   // Load user data
//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         if (!accessToken) {
//           navigate('/login', { state: { error: "Please login to continue" } });
//           return;
//         }
        
//         setLoading(true);
//         const response = await api.get('/user/me', {
//           headers: { Authorization: `Bearer ${accessToken}` }
//         });

//         if (response.data.success) {
//           const userData = response.data.data;
//           setUser(userData);
//           setFormData(prev => ({
//             ...prev,
//             username: userData.username || '',
//             email: userData.email || '',
//             fullName: userData.fullName || '',
//           }));
//         } else {
//           throw new Error(response.data.message);
//         }
//       } catch (error) {
//         console.error("Error fetching user:", error.message);
//         toaster.create({
//           title: "Error",
//           description: "Failed to load user information. Please try again.",
//           type: "error",
//           duration: 3000,
//           isClosable: true,
//         });
        
//         if (error.response?.status === 401) {
//           await logout();
//           navigate("/login", { state: { error: "Session expired, please login again" } });
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [accessToken, navigate, setUser, logout]);

//   // Handle input changes
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value
//     });
    
//     // Clear error when typing
//     if (errors[name]) {
//       setErrors({
//         ...errors,
//         [name]: ''
//       });
//     }
//   };

//   // Toggle password change form
//   const togglePasswordChange = () => {
//     setFormData({
//       ...formData,
//       changePassword: !formData.changePassword,
//       currentPassword: '',
//       newPassword: '',
//       confirmPassword: ''
//     });
    
//     // Clear password-related errors
//     setErrors({
//       ...errors,
//       currentPassword: '',
//       newPassword: '',
//       confirmPassword: ''
//     });
//   };

//   // Validate form
//   const validateForm = () => {
//     const newErrors = {};
    
//     // Basic validations
//     if (!formData.username || formData.username.length < 4 || formData.username.length > 20) {
//       newErrors.username = 'Username must be between 4 and 20 characters';
//     }
    
//     if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
//       newErrors.email = 'Please enter a valid email address';
//     }
    
//     // Password validations (only if changing password)
//     if (formData.changePassword) {
//       if (!formData.currentPassword) {
//         newErrors.currentPassword = 'Current password is required';
//       }
      
//       if (!formData.newPassword || formData.newPassword.length < 8) {
//         newErrors.newPassword = 'New password must be at least 8 characters';
//       }
      
//       if (formData.newPassword !== formData.confirmPassword) {
//         newErrors.confirmPassword = 'Passwords do not match';
//       }
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }
    
//     setUpdating(true);
    
//     try {
//       // Prepare request payload
//       const updateData = {
//         username: formData.username,
//         email: formData.email,
//         fullName: formData.fullName
//       };
      
//       // Add password fields if changing password
//       if (formData.changePassword) {
//         updateData.currentPassword = formData.currentPassword;
//         updateData.newPassword = formData.newPassword;
//       }
      
//       const response = await api.put('/user/update', updateData, {
//         headers: { Authorization: `Bearer ${accessToken}` }
//       });
      
//       if (response.data.success) {
//         // Update user in state
//         setUser(response.data.data);
        
//         toaster.create({
//           title: "Success",
//           description: "Profile updated successfully",
//           type: "success",
//           duration: 3000,
//           isClosable: true,
//         });
        
//         // Clear password fields
//         if (formData.changePassword) {
//           setFormData({
//             ...formData,
//             currentPassword: '',
//             newPassword: '',
//             confirmPassword: '',
//             changePassword: false
//           });
//         }
//       } else {
//         throw new Error(response.data.message);
//       }
//     } catch (error) {
//       console.error("Error updating profile:", error);
      
//       // Handle specific error responses
//       if (error.response?.data?.errors) {
//         const serverErrors = {};
//         error.response.data.errors.forEach(err => {
//           serverErrors[err.param] = err.msg;
//         });
//         setErrors(serverErrors);
//       } else {
//         toaster.create({
//           title: "Update Failed",
//           description: error.response?.data?.message || "Failed to update profile. Please try again.",
//           type: "error",
//           duration: 3000,
//           isClosable: true,
//         });
//       }
      
//       // Handle authentication errors
//       if (error.response?.status === 401) {
//         await logout();
//         navigate("/login", { state: { error: "Session expired, please login again" } });
//       }
//     } finally {
//       setUpdating(false);
//     }
//   };

//   // Handle account deletion
//   const handleDeleteAccount = async () => {
//     setDeleting(true);
    
//     try {
//       await api.delete('/user/delete', {
//         headers: { Authorization: `Bearer ${accessToken}` }
//       });
      
//       toaster.create({
//         title: "Account Deleted",
//         description: "Your account has been successfully deleted.",
//         type: "success",
//         duration: 3000,
//         isClosable: true,
//       });
      
//       await logout();
//       navigate("/login", { state: { message: "Your account has been deleted. We're sorry to see you go." } });
//     } catch (error) {
//       console.error("Error deleting account:", error);
      
//       toaster.create({
//         title: "Deletion Failed",
//         description: error.response?.data?.message || "Failed to delete account. Please try again.",
//         type: "error",
//         duration: 3000,
//         isClosable: true,
//       });
      
//       onClose();
//     } finally {
//       setDeleting(false);
//     }
//   };

//   // Toggle password visibility
//   const togglePasswordVisibility = (field) => {
//     switch (field) {
//       case 'current':
//         setShowPassword(!showPassword);
//         break;
//       case 'new':
//         setShowNewPassword(!showNewPassword);
//         break;
//       case 'confirm':
//         setShowConfirmPassword(!showConfirmPassword);
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <Box display="flex" position="relative" minH="100vh" bg="gray.100">
//       <Toaster />
      
//       {/* Header with user info */}
//       <Flex position="absolute" top="4" right="4" zIndex="100" align="center" gap="2">
//         <Tooltip content="User information" openDelay={400}>
//           <Infomation />
//         </Tooltip>
//       </Flex>

//       {/* Main content */}
//       <Box flex="1" py={10} px={4}>
//         <Box maxW="600px" mx="auto" bg="white" borderRadius="lg" p={6} boxShadow="md">
//           {loading ? (
//             <Flex direction="column" align="center" justify="center" minH="400px">
//               <Spinner size="xl" color="blue.500" />
//               <Text mt={4} color="gray.600">Loading profile information...</Text>
//             </Flex>
//           ) : (
//             <>
//               <Heading as="h1" size="lg" mb={6} color="blue.600" textAlign="center">
//                 My Profile
//               </Heading>
              
//               <form onSubmit={handleSubmit}>
//                 <VStack spacing={5} align="stretch">
//                   {/* Username field */}
//                   <FormControl isInvalid={!!errors.username}>
//                     <FormLabel htmlFor="username" display="flex" alignItems="center">
//                       <BiUser style={{ marginRight: '8px' }} />
//                       Username
//                     </FormLabel>
//                     <Input
//                       id="username"
//                       name="username"
//                       value={formData.username}
//                       onChange={handleInputChange}
//                       borderColor="gray.300"
//                       _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
//                     />
//                     {errors.username && (
//                       <FormErrorMessage>{errors.username}</FormErrorMessage>
//                     )}
//                   </FormControl>
                  
//                   {/* Email field */}
//                   <FormControl isInvalid={!!errors.email}>
//                     <FormLabel htmlFor="email" display="flex" alignItems="center">
//                       <BiEnvelope style={{ marginRight: '8px' }} />
//                       Email
//                     </FormLabel>
//                     <Input
//                       id="email"
//                       name="email"
//                       type="email"
//                       value={formData.email}
//                       onChange={handleInputChange}
//                       borderColor="gray.300"
//                       _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
//                     />
//                     {errors.email && (
//                       <FormErrorMessage>{errors.email}</FormErrorMessage>
//                     )}
//                   </FormControl>
                  
//                   {/* Full name field */}
//                   <FormControl>
//                     <FormLabel htmlFor="fullName" display="flex" alignItems="center">
//                       <BiUser style={{ marginRight: '8px' }} />
//                       Full Name
//                     </FormLabel>
//                     <Input
//                       id="fullName"
//                       name="fullName"
//                       value={formData.fullName}
//                       onChange={handleInputChange}
//                       borderColor="gray.300"
//                       _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
//                     />
//                   </FormControl>
                  
//                   {/* Password change toggle */}
//                   <FormControl display="flex" alignItems="center" my={4}>
//                     <FormLabel htmlFor="changePassword" mb="0" display="flex" alignItems="center">
//                       <BiLock style={{ marginRight: '8px' }} />
//                       Change Password
//                     </FormLabel>
//                     <Switch 
//                       id="changePassword"
//                       isChecked={formData.changePassword}
//                       onChange={togglePasswordChange}
//                       colorScheme="blue"
//                     />
//                   </FormControl>
                  
//                   {/* Password change fields */}
//                   {formData.changePassword && (
//                     <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50">
//                       {/* Current password */}
//                       <FormControl isInvalid={!!errors.currentPassword} mb={3}>
//                         <FormLabel htmlFor="currentPassword">Current Password</FormLabel>
//                         <InputGroup>
//                           <Input
//                             id="currentPassword"
//                             name="currentPassword"
//                             type={showPassword ? "text" : "password"}
//                             value={formData.currentPassword}
//                             onChange={handleInputChange}
//                             borderColor="gray.300"
//                             _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
//                           />
//                           <InputRightElement width="3rem">
//                             <Button 
//                               h="1.75rem" 
//                               size="sm" 
//                               onClick={() => togglePasswordVisibility('current')}
//                               bg="transparent"
//                               _hover={{ bg: 'transparent' }}
//                             >
//                               {showPassword ? <BiHide /> : <BiShow />}
//                             </Button>
//                           </InputRightElement>
//                         </InputGroup>
//                         {errors.currentPassword && (
//                           <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
//                         )}
//                       </FormControl>
                      
//                       {/* New password */}
//                       <FormControl isInvalid={!!errors.newPassword} mb={3}>
//                         <FormLabel htmlFor="newPassword">New Password</FormLabel>
//                         <InputGroup>
//                           <Input
//                             id="newPassword"
//                             name="newPassword"
//                             type={showNewPassword ? "text" : "password"}
//                             value={formData.newPassword}
//                             onChange={handleInputChange}
//                             borderColor="gray.300"
//                             _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
//                           />
//                           <InputRightElement width="3rem">
//                             <Button 
//                               h="1.75rem" 
//                               size="sm" 
//                               onClick={() => togglePasswordVisibility('new')}
//                               bg="transparent"
//                               _hover={{ bg: 'transparent' }}
//                             >
//                               {showNewPassword ? <BiHide /> : <BiShow />}
//                             </Button>
//                           </InputRightElement>
//                         </InputGroup>
//                         {errors.newPassword && (
//                           <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
//                         )}
//                       </FormControl>
                      
//                       {/* Confirm password */}
//                       <FormControl isInvalid={!!errors.confirmPassword}>
//                         <FormLabel htmlFor="confirmPassword">Confirm New Password</FormLabel>
//                         <InputGroup>
//                           <Input
//                             id="confirmPassword"
//                             name="confirmPassword"
//                             type={showConfirmPassword ? "text" : "password"}
//                             value={formData.confirmPassword}
//                             onChange={handleInputChange}
//                             borderColor="gray.300"
//                             _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
//                           />
//                           <InputRightElement width="3rem">
//                             <Button 
//                               h="1.75rem" 
//                               size="sm" 
//                               onClick={() => togglePasswordVisibility('confirm')}
//                               bg="transparent"
//                               _hover={{ bg: 'transparent' }}
//                             >
//                               {showConfirmPassword ? <BiHide /> : <BiShow />}
//                             </Button>
//                           </InputRightElement>
//                         </InputGroup>
//                         {errors.confirmPassword && (
//                           <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
//                         )}
//                       </FormControl>
//                     </Box>
//                   )}
                  
//                   {/* Action buttons */}
//                   <Flex justifyContent="space-between" mt={6}>
//                     <Button
//                       type="button"
//                       onClick={onOpen}
//                       colorScheme="red"
//                       variant="outline"
//                       leftIcon={<MdDelete />}
//                     >
//                       Delete Account
//                     </Button>
                    
//                     <Button
//                       type="submit"
//                       colorScheme="blue"
//                       isLoading={updating}
//                       loadingText="Updating"
//                     >
//                       Save Changes
//                     </Button>
//                   </Flex>
//                 </VStack>
//               </form>
//             </>
//           )}
//         </Box>
//       </Box>
      
//       {/* Delete account confirmation dialog */}
//       <Dialog.Root isOpen={isOpen} onClose={onClose}>
//         <Portal>
//           <Dialog.Backdrop />
//           <Dialog.Positioner>
//             <Dialog.Content>
//               <Dialog.Header>
//                 <Dialog.Title>CONFIRM ACCOUNT DELETION</Dialog.Title>
//               </Dialog.Header>
//               <Dialog.Body>
//                 <Text>
//                   Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
//                 </Text>
//                 <Text mt={4} fontWeight="bold">
//                   To confirm deletion, please type "DELETE" below:
//                 </Text>
//                 <Input 
//                   mt={2}
//                   placeholder="Type DELETE to confirm"
//                   id="deleteConfirmation"
//                 />
//               </Dialog.Body>
//               <Dialog.Footer>
//                 <Dialog.ActionTrigger asChild>
//                   <Button variant="outline">Cancel</Button>
//                 </Dialog.ActionTrigger>
//                 <Button
//                   bg="red.500"
//                   _hover={{ bg: "red.300" }}
//                   onClick={handleDeleteAccount}
//                   isLoading={deleting}
//                   loadingText="Deleting"
//                   isDisabled={document.getElementById('deleteConfirmation')?.value !== 'DELETE'}
//                 >
//                   Delete My Account
//                 </Button>
//               </Dialog.Footer>
//             </Dialog.Content>
//           </Dialog.Positioner>
//         </Portal>
//       </Dialog.Root>
//     </Box>
//   );
// };

// export default ProfilePage;