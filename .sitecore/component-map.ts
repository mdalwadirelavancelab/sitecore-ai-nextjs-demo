// Below are built-in components that are available in the app, it's recommended to keep them as is
import { NextjsContentSdkComponent } from '@sitecore-content-sdk/nextjs';


import { BYOCServerWrapper, FEaaSServerWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in import section
import * as PartialDesignDynamicPlaceholder from 'src/components/partial-design-dynamic-placeholder/PartialDesignDynamicPlaceholder';
import * as DsiWrapperComponent from 'src/components/DSI/CoreUI/DsiWrapperComponent';
import * as DsiTabsComponent from 'src/components/DSI/CoreUI/DsiTabsComponent';
import * as DsiSectionComponent from 'src/components/DSI/CoreUI/DsiSectionComponent';
import * as DsiSearchboxComponent from 'src/components/DSI/CoreUI/DsiSearchboxComponent';
import * as DsiRichTextComponent from 'src/components/DSI/CoreUI/DsiRichTextComponent';
import * as DsiPromoCardComponent from 'src/components/DSI/CoreUI/DsiPromoCardComponent';
import * as DsiPlainHTMLComponent from 'src/components/DSI/CoreUI/DsiPlainHTMLComponent';
import * as DsiPageSearchComponent from 'src/components/DSI/CoreUI/DsiPageSearchComponent';
import * as DsiNavigationComponent from 'src/components/DSI/CoreUI/DsiNavigationComponent';
import * as DsiLinkListComponent from 'src/components/DSI/CoreUI/DsiLinkListComponent';
import * as DsiLinkComponent from 'src/components/DSI/CoreUI/DsiLinkComponent';
import * as DsiImageComponent from 'src/components/DSI/CoreUI/DsiImageComponent';
import * as DsiIconCardComponent from 'src/components/DSI/CoreUI/DsiIconCardComponent';
import * as DsiHeroComponent from 'src/components/DSI/CoreUI/DsiHeroComponent';
import * as DsiHeaderSearchComponent from 'src/components/DSI/CoreUI/DsiHeaderSearchComponent';
import * as DsiColumnLayoutComponent from 'src/components/DSI/CoreUI/DsiColumnLayoutComponent';
import * as DsiCarouselComponent from 'src/components/DSI/CoreUI/DsiCarouselComponent';
import * as DsiAccordionComponent from 'src/components/DSI/CoreUI/DsiAccordionComponent';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCServerWrapper],
  ['FEaaSWrapper', FEaaSServerWrapper],
  ['Form', { ...Form, componentType: 'client' }],
  ['PartialDesignDynamicPlaceholder', { ...PartialDesignDynamicPlaceholder }],
  ['DsiWrapperComponent', { ...DsiWrapperComponent }],
  ['DsiTabsComponent', { ...DsiTabsComponent, componentType: 'client' }],
  ['DsiSectionComponent', { ...DsiSectionComponent }],
  ['DsiSearchboxComponent', { ...DsiSearchboxComponent }],
  ['DsiRichTextComponent', { ...DsiRichTextComponent }],
  ['DsiPromoCardComponent', { ...DsiPromoCardComponent }],
  ['DsiPlainHTMLComponent', { ...DsiPlainHTMLComponent }],
  ['DsiPageSearchComponent', { ...DsiPageSearchComponent }],
  ['DsiNavigationComponent', { ...DsiNavigationComponent, componentType: 'client' }],
  ['DsiLinkListComponent', { ...DsiLinkListComponent }],
  ['DsiLinkComponent', { ...DsiLinkComponent }],
  ['DsiImageComponent', { ...DsiImageComponent }],
  ['DsiIconCardComponent', { ...DsiIconCardComponent }],
  ['DsiHeroComponent', { ...DsiHeroComponent }],
  ['DsiHeaderSearchComponent', { ...DsiHeaderSearchComponent, componentType: 'client' }],
  ['DsiColumnLayoutComponent', { ...DsiColumnLayoutComponent }],
  ['DsiCarouselComponent', { ...DsiCarouselComponent, componentType: 'client' }],
  ['DsiAccordionComponent', { ...DsiAccordionComponent, componentType: 'client' }],
]);

export default componentMap;
