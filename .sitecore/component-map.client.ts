// Client-safe component map for App Router
import { NextjsContentSdkComponent } from '@sitecore-content-sdk/nextjs';


import { BYOCClientWrapper, FEaaSClientWrapper } from '@sitecore-content-sdk/nextjs';
import { Form } from '@sitecore-content-sdk/nextjs';

// end of built-in import section
import * as DsiTabsComponent from 'src/components/DSI/CoreUI/DsiTabsComponent';
import * as DsiPlainHTMLComponent from 'src/components/DSI/CoreUI/DsiPlainHTMLComponent';
import * as DsiNavigationComponent from 'src/components/DSI/CoreUI/DsiNavigationComponent';
import * as DsiMegaNavigationComponent from 'src/components/DSI/CoreUI/DsiMegaNavigationComponent';
import * as DsiHeaderSearchComponent from 'src/components/DSI/CoreUI/DsiHeaderSearchComponent';
import * as DsiCarouselComponent from 'src/components/DSI/CoreUI/DsiCarouselComponent';
import * as DsiAccordionComponent from 'src/components/DSI/CoreUI/DsiAccordionComponent';

export const componentMap = new Map<string, NextjsContentSdkComponent>([
  ['BYOCWrapper', BYOCClientWrapper],
  ['FEaaSWrapper', FEaaSClientWrapper],
  ['Form', Form],
  ['DsiTabsComponent', { ...DsiTabsComponent }],
  ['DsiPlainHTMLComponent', { ...DsiPlainHTMLComponent }],
  ['DsiNavigationComponent', { ...DsiNavigationComponent }],
  ['DsiMegaNavigationComponent', { ...DsiMegaNavigationComponent }],
  ['DsiHeaderSearchComponent', { ...DsiHeaderSearchComponent }],
  ['DsiCarouselComponent', { ...DsiCarouselComponent }],
  ['DsiAccordionComponent', { ...DsiAccordionComponent }],
]);

export default componentMap;
