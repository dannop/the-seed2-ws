import { ICharacter, Character } from "../models/Character";

export const getNearbyCharacters = async (player: ICharacter, maxDistance: number) => {
  const { x, y, z } = player.position;

  // Busca personagens em uma caixa aproximada primeiro (otimização)
  const nearbyBox = await Character.find({
    _id: { $ne: player._id }, // Exclui o próprio jogador
    ws: { $exists: true, $ne: null }, // Verifica se o WebSocket existe e não é null
    "position.x": { $gte: x - maxDistance, $lte: x + maxDistance },
    "position.y": { $gte: y - maxDistance, $lte: y + maxDistance },
    "position.z": { $gte: z - maxDistance, $lte: z + maxDistance },
  });

  // Filtra pela distância euclidiana real
  return nearbyBox.filter(character => {
    const dx = character.position.x - x;
    const dy = character.position.y - y;
    const dz = character.position.z - z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance <= maxDistance;
  });
};