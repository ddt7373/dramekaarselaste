// Placeholder Moodle client for LMS integration
export const importMoodleClient = async () => {
    return {
        connect: async () => ({ success: false, error: 'Moodle client not configured' }),
        getCourses: async () => [],
        getUsers: async () => [],
    };
};

export default importMoodleClient;
