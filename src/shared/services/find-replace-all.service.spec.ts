/*
 * This file is part of ng2-json-editor.
 * Copyright (C) 2016 CERN.
 *
 * ng2-json-editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * ng2-json-editor is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ng2-json-editor; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.
 * In applying this license, CERN does not
 * waive the privileges and immunities granted to it by virtue of its status
 * as an Intergovernmental Organization or submit itself to any jurisdiction.
*/

import { FindReplaceAllService } from './find-replace-all.service';

import { fromJS } from 'immutable';

describe('FindReplaceAllService', () => {
  let service: FindReplaceAllService;

  beforeEach(() => {
    service = new FindReplaceAllService();
  });

  it('should find and replace all in nested map', () => {
    let map = fromJS({
      foo: {
        bar: {
          a: 'valueA',
          b: 'valueB'
        }
      }
    });

    let schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          properties: {
            bar: {
              type: 'object',
              properties: {
                a: {
                  type: 'string'
                },
                b: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    };

    let expected = fromJS({
      foo: {
        bar: {
          a: 'replacementA',
          b: 'replacementB'
        }
      }
    });

    let replacedMap = service.findReplaceInImmutable(map, schema, 'value', 'replacement').replaced;

    expect(replacedMap.equals(expected)).toBeTruthy();
  });

  it('should return correct diffHtml for nested map', () => {
    let map = fromJS({
      foo: {
        bar: {
          a: 'valueA',
          b: 'valueB',
          c: 'nothingToReplace'
        }
      }
    });

    let schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          properties: {
            bar: {
              type: 'object',
              properties: {
                a: {
                  type: 'string'
                },
                b: {
                  type: 'string'
                },
                c: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    };

    let expected = {
      foo: {
        bar: {
          a: `<strong style='color: green;'>replacement</strong><del><em style='color: red;'>value</em></del>A`,
          b: `<strong style='color: green;'>replacement</strong><del><em style='color: red;'>value</em></del>B`,
          c: 'nothingToReplace'
        }
      }
    };

    let diffHtml = service.findReplaceInImmutable(map, schema, 'value', 'replacement').diffHtml;

    expect(diffHtml).toEqual(expected);
  });

  it('should return correct diffHtml and replaced for nested map with list property', () => {
    let map = fromJS({
      foo:
      [
        {
          a: 'value1A',
        },
        {
          a: 'value2A',
        },
        {
          a: 'nothingToReplace'
        }
      ]
    });

    let schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              a: {
                type: 'string'
              }
            }
          }
        }
      }
    };

    let expectedReplaced = fromJS({
      foo:
      [
        {
          a: 'replacement1A',
        },
        {
          a: 'replacement2A',
        },
        {
          a: 'nothingToReplace'
        }
      ]
    });

    let expectedDiffHtml = {
      foo: [
        {
          a: `<strong style='color: green;'>replacement</strong><del><em style='color: red;'>value</em></del>1A`
        },
        {
          a: `<strong style='color: green;'>replacement</strong><del><em style='color: red;'>value</em></del>2A`
        },
        {
          a: 'nothingToReplace'
        }
      ]
    };

    let result = service.findReplaceInImmutable(map, schema, 'value', 'replacement');

    expect(result.diffHtml).toEqual(expectedDiffHtml);
    expect(result.replaced.equals(expectedReplaced)).toBeTruthy();
  });

  it('should find and replace all occurrences in a field', () => {
    let map = fromJS({
      foo: {
        bar: 'value:value'
      }
    });

    let schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          properties: {
            bar: {
              type: 'string'
            }
          }
        }
      }
    };

    let expected = fromJS({
      foo: {
        bar: 'replacement:replacement'
      }
    });

    let replacedMap = service.findReplaceInImmutable(map, schema, 'value', 'replacement').replaced;

    expect(replacedMap.equals(expected)).toBeTruthy();
  });

  it('should replace only if exact match when matchWhole is set', () => {
    let map = fromJS({
      foo: {
        bar: {
          prop: 'value',
          anotherProp: 'another value',
          propAnother: 'value another'
        }
      }
    });

    let schema = {
      type: 'object',
      properties: {
        foo: {
          type: 'object',
          properties: {
            bar: {
              type: 'object',
              properties: {
                prop: {
                  type: 'string'
                },
                anotherProp: {
                  type: 'string'
                },
                propAnother: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    };

    let expected = fromJS({
      foo: {
        bar: {
          prop: 'replacement',
          anotherProp: 'another value',
          propAnother: 'value another'
        }
      }
    });

    let replacedMap = service.findReplaceInImmutable(map, schema, 'value', 'replacement', true).replaced;

    expect(replacedMap.equals(expected)).toBeTruthy();
  });

  it('should find and replace in list of maps but skip disabled string field', () => {
    let list = fromJS([
      {
        foo: {
          bar: {
            a: 'valueA1',
            b: 'valueB1'
          }
        }
      },
      {
        foo: {
          bar: {
            a: 'valueA2',
            b: 'valueB2'
          }
        }
      },
    ]);

    let schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            properties: {
              bar: {
                type: 'object',
                properties: {
                  a: {
                    type: 'string'
                  },
                  b: {
                    type: 'string',
                    x_editor_disabled: true
                  }
                }
              }
            }
          }
        }
      }
    };

    let expected = fromJS([
      {
        foo: {
          bar: {
            a: 'replacementA1',
            b: 'valueB1'
          }
        }
      },
      {
        foo: {
          bar: {
            a: 'replacementA2',
            b: 'valueB2'
          }
        }
      },
    ]);

    let replacedList = service.findReplaceInImmutable(list, schema, 'value', 'replacement').replaced;

    expect(replacedList.equals(expected)).toBeTruthy();
  });

  it('should find and replace in list of maps but skip disabled list and map field', () => {
    let list = fromJS([
      {
        foo: {
          bar: {
            a: 'valueA1',
            b: 'valueB1',
            c: ['1valueC1', '2valueC1'],
            d: [
              { da: 'valueDA1' }
            ],
            e: {
              ea: 'valueEA1'
            }
          }
        }
      },
      {
        foo: {
          bar: {
            a: 'valueA2',
            b: 'valueB2',
            c: ['1valueC2', '2valueC2'],
            d: [
              { da: 'valueDA2' }
            ],
            e: {
              ea: 'valueEA2'
            }
          }
        }
      }
    ]);

    let schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          foo: {
            type: 'object',
            properties: {
              bar: {
                type: 'object',
                properties: {
                  a: {
                    type: 'string'
                  },
                  b: {
                    type: 'string',
                  },
                  c: {
                    x_editor_disabled: true,
                    type: 'array',
                    items: {
                      type: 'string'
                    }
                  },
                  d: {
                    x_editor_disabled: true,
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        da: {
                          type: 'string'
                        }
                      }
                    }
                  },
                  e: {
                    x_editor_disabled: true,
                    type: 'object',
                    properties: {
                      ea: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    let expected = fromJS([
      {
        foo: {
          bar: {
            a: 'replacementA1',
            b: 'replacementB1',
            c: ['1valueC1', '2valueC1'],
            d: [
              {
                da: 'valueDA1'
              }
            ],
            e: {
              ea: 'valueEA1'
            }
          }
        }
      },
      {
        foo: {
          bar: {
            a: 'replacementA2',
            b: 'replacementB2',
            c: ['1valueC2', '2valueC2'],
            d: [
              {
                da: 'valueDA2'
              }
            ],
            e: {
              ea: 'valueEA2'
            }
          }
        }
      }
    ]);

    let replacedList = service.findReplaceInImmutable(list, schema, 'value', 'replacement').replaced;

    expect(replacedList.equals(expected)).toBeTruthy();
  });

  it('should skip $ref fields', () => {
    let list = fromJS([
      {
        record: {
          $ref: 'value1'
        }
      },
      {
        record: {
          $ref: 'value2'
        }
      },
    ]);

    let schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          record: {
            type: 'object',
            properties: {
              $ref: {
                type: 'string'
              }
            }
          }
        }
      }
    };

    let expected = fromJS([
      {
        record: {
          $ref: 'value1'
        }
      },
      {
        record: {
          $ref: 'value2'
        }
      },
    ]);

    let replacedList = service.findReplaceInImmutable(list, schema, 'value', 'replacement').replaced;

    expect(replacedList.equals(expected)).toBeTruthy();
  });

  it('should skip hidden fields', () => {
    let map = fromJS({
      hiddenProp: 'valueHidden',
      notHiddenProp: 'valueNotHidden'
    });

    let schema = {
      type: 'object',
      properties: {
        hiddenProp: {
          type: 'string',
          x_editor_hidden: true
        },
        notHiddenProp: {
          type: 'string'
        }
      }
    };

    let expected = fromJS({
      hiddenProp: 'valueHidden',
      notHiddenProp: 'replacementNotHidden'
    });

    let replacedList = service.findReplaceInImmutable(map, schema, 'value', 'replacement').replaced;

    expect(replacedList.equals(expected)).toBeTruthy();
  });

});