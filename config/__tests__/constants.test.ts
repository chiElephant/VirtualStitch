import * as constants from '../constants';

describe('constants', () => {
  it('should have EditorTabs defined with expected items', () => {
    expect(constants.EditorTabs).toBeDefined();
    expect(Array.isArray(constants.EditorTabs)).toBe(true);
    expect(
      constants.EditorTabs.find((tab) => tab.name === 'colorPicker')
    ).toBeTruthy();
    expect(
      constants.EditorTabs.find((tab) => tab.name === 'filePicker')
    ).toBeTruthy();
    expect(
      constants.EditorTabs.find((tab) => tab.name === 'aiPicker')
    ).toBeTruthy();
    expect(
      constants.EditorTabs.find((tab) => tab.name === 'imageDownload')
    ).toBeTruthy();
  });

  it('should have FilterTabs defined with expected items', () => {
    expect(constants.FilterTabs).toBeDefined();
    expect(Array.isArray(constants.FilterTabs)).toBe(true);
    expect(
      constants.FilterTabs.find((tab) => tab.name === 'logoShirt')
    ).toBeTruthy();
    expect(
      constants.FilterTabs.find((tab) => tab.name === 'stylishShirt')
    ).toBeTruthy();
  });

  it('should have DecalTypes defined with logo and full types', () => {
    expect(constants.DecalTypes).toBeDefined();
    expect(constants.DecalTypes.logo).toEqual({
      stateProperty: 'logoDecal',
      filterTab: 'logoShirt',
    });
    expect(constants.DecalTypes.full).toEqual({
      stateProperty: 'fullDecal',
      filterTab: 'stylishShirt',
    });
  });
});
