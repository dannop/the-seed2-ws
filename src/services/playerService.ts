import { IPlayer, Player } from "../models/Player";

export const getNearbyPlayers = async (player: IPlayer, maxDistance: number) => {
  const { x, y, z } = player.position;

  return await Player.find({
    ws: { $ne: null },
    "position.x": { $gte: x - maxDistance, $lte: x + maxDistance },
    "position.y": { $gte: y - maxDistance, $lte: y + maxDistance },
    "position.z": { $gte: z - maxDistance, $lte: z + maxDistance },
  });
};