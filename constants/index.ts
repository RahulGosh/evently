export const headerLinks = [
    {
      label: 'Home',
      route: '/',
    },
    {
      label: 'Create Event',
      route: '/protected/admin/events/create',
    },
    {
      label: 'My Profile',
      route: '/protected/profile',
    },
  ]
  
  export const eventDefaultValues = {
    title: '',
    description: '',
    location: '',
    imageUrl: '',
    startDateTime: new Date(),
    endDateTime: new Date(),
    categoryId: '',
    price: '',
    isFree: false,
    url: '',
  }