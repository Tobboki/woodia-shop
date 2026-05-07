import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FURNITURE_COLORS } from 'shared-lib/furniture';

@Injectable({
  providedIn: 'root'
})
export class AiDesignService {
  private http = inject(HttpClient);
  private apiUrl = 'https://aygaaa-furniture-ml-api.hf.space/predict';

  // Questions configuration
  public readonly ROOM_TYPES = ['bedroom', 'home_office', 'kids_room', 'living_room', 'studio'];
  public readonly ROOM_STYLES = ['bohemian', 'classic', 'industrial', 'minimal', 'modern', 'scandinavian'];
  public readonly WALL_COLORS = ['beige', 'charcoal', 'light_blue', 'navy', 'sage', 'terracotta', 'white'];
  public readonly TV_SIZES = [32, 43, 55, 65, 75, 85];
  public readonly SHOE_COUNTS = ['1-10', '11-20', '21+'];
  public readonly DESK_USAGES = ['display', 'entertainment', 'storage', 'study', 'work'];
  public readonly BEDSIDE_USAGES = ['display', 'entertainment', 'storage', 'study', 'work'];

  private randomItem(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private fillHiddenAnswers(productType: string, userAnswers: any) {
    const floor_materials = ['carpet', 'concrete', 'hardwood', 'laminate', 'tile'];
    const existing_materials = ['fabric', 'glass', 'metal', 'plastic', 'wood'];
    const light_levels = ['high', 'low', 'medium'];

    const answers = { ...userAnswers };

    // Common hidden defaults
    answers.floor_material = answers.floor_material ?? this.randomItem(floor_materials);
    answers.is_behind_door = answers.is_behind_door ?? false;
    answers.existing_material = answers.existing_material ?? this.randomItem(existing_materials);
    answers.light_level = answers.light_level ?? this.randomItem(light_levels);
    answers.age_group = answers.room_type === 'kids_room' ? 'child' : 'adult';
    answers.has_pets = answers.has_pets ?? this.randomItem([true, false]);
    answers.budget = answers.budget ?? 'medium';

    if (productType === 'Bookcase') {
      answers.primary_usage = answers.primary_usage ?? (answers.room_type === 'bedroom' ? 'storage' : 'display');
      answers.storage_preference = answers.storage_preference ?? 'mixed';
      answers.needs_bottom_storage = answers.needs_bottom_storage ?? false;
    } else if (productType === 'Desk') {
      answers.storage_preference = answers.storage_preference ?? 'hidden';
      answers.needs_cable_management = answers.needs_cable_management ?? false;
      answers.side_cabinet = answers.side_cabinet ?? false;
    } else if (productType === 'TvStand') {
      answers.primary_usage = answers.primary_usage ?? 'entertainment';
      answers.has_open_display_column = answers.has_open_display_column ?? false;
      answers.needs_cable_management = answers.needs_cable_management ?? true;
      answers.side_cabinet = answers.side_cabinet ?? false;
    } else if (productType === 'ShoeRack') {
      answers.is_behind_door = true;
      answers.primary_usage = answers.primary_usage ?? 'storage';
      answers.storage_preference = answers.storage_preference ?? 'open';
    } else if (productType === 'BedsideTable') {
      answers.storage_preference = answers.storage_preference ?? 'hidden';
      answers.needs_cable_management = answers.needs_cable_management ?? true;
    }

    return answers;
  }

  public predict(productType: string, userAnswers: any): Observable<any> {
    const payload = {
      product_type: productType,
      answers: this.fillHiddenAnswers(productType, userAnswers)
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(response => {
        if (!response || !response.config) {
          throw new Error('Invalid response from AI API');
        }
        return this.normalizeConfig(productType, response.config);
      })
    );
  }

  // Normalization logic to correct incorrect AI generated config data
  private normalizeConfig(productType: string, config: any): any {
    const safeInt = (val: any, defaultVal = 0) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? defaultVal : num;
    };
    const safeFloat = (val: any, defaultVal = 0) => {
      const num = parseFloat(val);
      return isNaN(num) ? defaultVal : num;
    };

    // Global dimension fixes
    if (config.widthCm !== undefined) config.widthCm = safeInt(config.widthCm);
    if (config.heightCm !== undefined) config.heightCm = safeInt(config.heightCm);
    if (config.depthCm !== undefined) config.depthCm = safeInt(config.depthCm);
    if (config.columns !== undefined) config.columns = safeInt(config.columns, 1);
    if (config.rows !== undefined) config.rows = safeInt(config.rows, 1);
    if (config.thicknessCm !== undefined) config.thicknessCm = safeFloat(config.thicknessCm);
    if (config.density !== undefined) config.density = safeInt(config.density);

    // Provide safe fallbacks for required 3D properties if missing from AI
    config.modelType = productType;
    config.color = this.curateColor(config.color);
    config.style = config.style || 'grid';
    config.withBack = config.withBack !== undefined ? config.withBack : true;
    config.legroomPosition = config.legroomPosition !== undefined ? safeInt(config.legroomPosition) : 0;
    
    // Array normalizations
    if (productType === 'Bookcase') {
      const expectedRows = config.rows || 1;
      if (!config.rowConfigs) {
         config.rowConfigs = [];
      }
      
      // Fix length of rowConfigs
      while (config.rowConfigs.length < expectedRows) {
        config.rowConfigs.push({ height: 'md', doors: 'none', drawers: 'none' });
      }
      if (config.rowConfigs.length > expectedRows) {
        config.rowConfigs = config.rowConfigs.slice(0, expectedRows);
      }
    } else if (['Desk', 'TvStand', 'ShoeRack', 'BedsideTable'].includes(productType)) {
      const expectedCols = config.columns || 1;
      if (!config.columnConfigs) {
         config.columnConfigs = [];
      }
      
      while (config.columnConfigs.length < expectedCols) {
        config.columnConfigs.push({ doors: 'none', drawers: 'none', hugeCell: false });
      }
      if (config.columnConfigs.length > expectedCols) {
        config.columnConfigs = config.columnConfigs.slice(0, expectedCols);
      }
    }

    return config;
  }

  private curateColor(color: string | undefined): string {
    if (!color) return FURNITURE_COLORS[0].value;

    // 1. Check for exact match in hex values
    const exactHex = FURNITURE_COLORS.find(c => c.value.toLowerCase() === color.toLowerCase());
    if (exactHex) return exactHex.value;

    // 2. Check for exact match in names
    const exactName = FURNITURE_COLORS.find(c => c.name.toLowerCase() === color.toLowerCase());
    if (exactName) return exactName.value;

    // 3. Common names mapping to hex for better matching
    const commonNames: Record<string, string> = {
      'oak': '#d4cfc9', // Sand
      'walnut': '#3c506a', // Deep Slate (dark wood)
      'white': '#f6efdd', // Antique White
      'black': '#474749', // Charcoal
      'blue': '#aec6de', // Steel Blue
      'red': '#b45c46', // Burnt Siena
      'green': '#6d7f4f', // Olive
      'grey': '#d4d4d4', // Light Grey
      'gray': '#d4d4d4', // Light Grey
    };

    let targetHex = color;
    if (commonNames[color.toLowerCase()]) {
      targetHex = commonNames[color.toLowerCase()];
    }

    // If it's still not a hex, we can't match it well, return default
    if (!targetHex.startsWith('#')) return FURNITURE_COLORS[0].value;

    // 4. Find nearest by RGB distance
    return this.findNearestColorByHex(targetHex);
  }

  private findNearestColorByHex(hex: string): string {
    const targetRgb = this.hexToRgb(hex);
    if (!targetRgb) return FURNITURE_COLORS[0].value;

    let minDistance = Infinity;
    let nearestColor = FURNITURE_COLORS[0].value;

    for (const c of FURNITURE_COLORS) {
      const rgb = this.hexToRgb(c.value);
      if (!rgb) continue;

      const distance = Math.sqrt(
        Math.pow(targetRgb.r - rgb.r, 2) +
        Math.pow(targetRgb.g - rgb.g, 2) +
        Math.pow(targetRgb.b - rgb.b, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestColor = c.value;
      }
    }

    return nearestColor;
  }

  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}
