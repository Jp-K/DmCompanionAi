import json
import os

def convert_spell_format(spell):
    components = [k.upper() for k, v in spell['components'].items() if v]
    if 'm' in spell['components'] and spell['components']['m']:
        components.append(f"M ({spell['components']['m']})")
    
    description = f"**Source:** {spell['source']} (Page {spell['page']})\n\n"
    description += f"**Level:** {spell['level']}\n"
    description += f"**School:** {spell['school']}\n"
    description += f"**Range:** {spell.get('range', '')}\n"
    description += f"**Time to cast:** {spell.get('time', '')}\n"
    description += f"**Duration:** {spell.get('duration', '')}\n"
    description += f"{spell.get('meta', '')}\n"
    description += f"**Components:** {', '.join(components)}\n\n"
    description += f"**Description:**\n{spell['entries']}"
    
    if 'entriesHigherLevel' in spell and spell['entriesHigherLevel']:
        description += f"\n\n**At Higher Levels:**\n{spell['entriesHigherLevel']}"
    
    return {
        "title": spell['name'],
        "source": spell['source'],
        "page": spell['page'],
        "type": "Spell",
        "description": description
    }

def main():
    base_path = os.path.dirname(__file__)
    spells_path = os.path.join(base_path, 'spells.json')
    
    with open(spells_path, 'r') as file:
        data = json.load(file)
    
    new_spells = [convert_spell_format(spell) for spell in data['spell']]
    
    new_spells_path = os.path.join(base_path, 'new_spells.json')
    with open(new_spells_path, 'w') as file:
        json.dump({"spells": new_spells}, file, indent=4)

if __name__ == "__main__":
    main()
