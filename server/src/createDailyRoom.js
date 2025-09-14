const fetch = require('node-fetch'); // You may need to install this: npm install node-fetch

/**
 * Creates a Daily.co room dynamically for an Empirica game
 * @param {Object} options - Configuration options
 * @param {string} options.apiKey - Your Daily.co API key
 * @param {string} options.gameId - The Empirica game ID (used in room name)
 * @param {string} options.roundId - The Empirica round ID (used in room name)
 * @param {number} [options.durationMinutes=60] - How long the room should last in minutes
 * @param {boolean} [options.enableRecording=true] - Whether to enable cloud recording
 * @param {string} [options.privacy='public'] - Room privacy: 'public' or 'private'
 * @returns {Promise<Object>} - Returns the room object with URL
 */
export async function createDailyRoom({
  apiKey,
  gameId,
  roundId,
  durationMinutes = 60,
  enableRecording = true,
  privacy = 'public'
}) {
  try {
    // Generate a unique room name using game and round IDs
    const roomName = `empirica-${gameId}-round-${roundId}-${Date.now()}`;
    
    // Calculate expiration time (current time + duration in seconds)
    const expirationTime = Math.floor(Date.now() / 1000) + (durationMinutes * 60);
    
    // Room configuration
    const roomConfig = {
      name: roomName,
      privacy: privacy,
      properties: {
        // Room expires after specified duration
        exp: expirationTime,
        
        // Enable cloud recording if requested
        enable_recording: 'cloud',
        
        // Useful settings for research/negotiation contexts
        enable_chat: true,
        enable_people_ui: true,
        enable_prejoin_ui: false, // Skip the waiting room

        // This shows names on video tiles
        enable_network_ui: true,
        
        // Automatically start/stop camera and mic
        start_video_off: false,
        start_audio_off: false,
        
        // Keep owner_only_broadcast OFF for now (as requested)
        owner_only_broadcast: false,
        
        // Automatically end meeting when room expires
        eject_at_room_exp: true,
        
        // Optional: Set a participant limit if needed
        // max_participants: 10,
        
        // Enable screen sharing
        enable_screenshare: false,
        
        // Useful for research: prevent participants from joining before room is ready
        // not_before: Math.floor(Date.now() / 1000), // Uncomment if needed


      }
    };

    // Make the API call to create the room
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(roomConfig)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Daily.co API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const room = await response.json();
    
    console.log(`Created Daily.co room: ${room.name}`);
    console.log(`Room URL: ${room.url}`);
    console.log(`Room expires at: ${new Date(room.config.exp * 1000)}`);
    
    return room;
    
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    throw error;
  }
}