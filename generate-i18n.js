const fs = require('fs');
const path = require('path');

const BASE = 'D:/Code/open/ydsz-micro';
const SRC = `${BASE}/apps/nextwiki-web/src/locales/langs`;
const COMM = `${BASE}/comm/locales/src/langs`;

const LOCALES = ['af-ZA','am-ET','ar-EG','ar-SA','az-AZ','bg-BG','bn-BD','bs-BA','ca-ES','cs-CZ','cy-GB','da-DK','de-AT','de-CH','de-DE','el-GR','en-GB','es-AR','es-ES','es-MX','et-EE','eu-ES','fa-IR','fi-FI','fil-PH','fr-CA','fr-FR','gl-ES','gu-IN','he-IL','hi-IN','hr-HR','hu-HU','hy-AM','id-ID','is-IS','it-IT','ja-JP','ka-GE','kk-KZ','km-KH','kn-IN','ko-KR','lo-LA','lt-LT','lv-LV','mk-MK','ml-IN','mn-MN','mr-IN','ms-MY','my-MM','nb-NO','ne-NP','nl-BE','nl-NL','pl-PL','pt-BR','pt-PT','ro-RO','ru-RU','si-LK','sk-SK','sl-SI','sq-AL','sr-RS','sv-SE','sw-KE','ta-IN','te-IN','th-TH','tr-TR','uk-UA','ur-PK','uz-UZ','vi-VN','zh-HK','zh-TW','zu-ZA'];

// Read zh-CN and en-US to get key order
const zhBiz = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/business.json`,'utf8'));
const zhPage = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/page.json`,'utf8'));
const enBiz = JSON.parse(fs.readFileSync(`${SRC}/en-US/business.json`,'utf8'));
const enPage = JSON.parse(fs.readFileSync(`${SRC}/en-US/page.json`,'utf8'));

const bizKeys = Object.keys(zhBiz);
const pageKeys = Object.keys(zhPage);

// Keys covered by comm layer
const commCommonKeys = new Set(['cancel','confirm','create','delete','edit','query','refresh','seq','status']);

// Read a locale's common.json from comm layer
function getCommCommon(locale) {
  try {
    return JSON.parse(fs.readFileSync(`${COMM}/${locale}/common.json`,'utf8'));
  } catch(e) { return {}; }
}

const T = {
  'am-ET': {
    fileName:'የፋይል ስም',fileSize:'መጠን',fileType:'የፋይል ዓይነት',filePath:'መንገድ',uploadTime:'የተሰቀለበት ጊዜ',owner:'ባለቤት',shareLink:'የአጋራ አገናኝ',sharePassword:'የይለፍ ቃል',expireTime:'የሚያልቅበት ጊዜ',tagName:'የመደብ ስም',tagColor:'ቀለም',commentContent:'ይዘት',commentAuthor:'ደራሲ',commentTime:'የአስተያየት ጊዜ',totalQuota:'ጠቅላላ',usedQuota:'ጸዳ',create:'ፍጠር',edit:'አርትዕ',delete:'ሰርዝ',confirmDelete:'ማጥፋት ንድፍ?',operationSuccess:'ተሳክቷል',seq:'ቁ.',name:'ስም',type:'ዓይነት',operation:'ክንውን',action:'ድርጊት',path:'መንገድ',createdBy:'የተፈጠረው በ',createdAt:'የተፈጠረበት',status:'ሁኔታ',visibility:'ታይነት',description:'መግለጫ',
    fileManagement:'የፋይል አስተዳደር',uploadFile:'ፋይል ስቀል',newFolder:'አዲስ አቃፊ',folderName:'የአቃፊ ስም',folderNamePlaceholder:'የአቃፊ ስም ያስገቡ',parentId:'የወላጅ መታወቂያ',parentIdPlaceholder:'የወላጅ መታወቂያ ያስገቡ (አማራጭ, ባዶ = ስር)',preview:'ቅድመ-እይታ',download:'አውርድ',onlineEdit:'አርትዕ',version:'ስሪት',rename:'እንደገና ሰይም',move:'አንቀሳቅስ',copy:'ቅዳ',nameColumn:'ስም',nodeType:'ዓይነት',fileSizeColumn:'መጠን',pathColumn:'መንገድ',createdByColumn:'የተፈጠረ በ',createdAtColumn:'የተፈጠረበት',nodeTypeDirectory:'ማውጫ',nodeTypeFile:'ፋይል',searchNamePlaceholder:'ስም ያስገቡ',confirmCopy:'"{name}"ን መቅዳት ትፈልጋለህ?',confirmDeleteFile:'"{name}"ን መሰረዝ ትፈልጋለህ? ይህ ድርጊት መመለስ አይቻልም።',deleteSuccess:'በተሳካ ሁኔታ ተሰርዟል',copySuccess:'በተሳካ ሁኔታ ተቀድቷል',renameTitle:'እንደገና ሰይም',renamePlaceholder:'አዲስ ስም ያስገቡ',renameNameRequired:'እባክዎ አዲስ ስም ያስገቡ',renameSuccess:'በተሳካ ሁኔታ ተሰይሟል',moveTitle:'ፋይል አንቀሳቅስ',movePlaceholder:'የዒላት ወላጅ መታወቂያ ያስገቡ (አማራጭ, ባዶ = ስር)',moveSuccess:'በተሳካ ሁኔታ ተንቀሳስቷል',uploadSuccess:'በተሳካ ሁኔታ ተሰቅሏል',downloadStarted:'ማውረድ ተጀምሯል',newFolderTitle:'አቃፊ ፍጠር',confirm:'አረጋግጥ',cancel:'ሰርዝ',versionRemark:'የስሪት ማስታወሻ',versionRemarkPlaceholder:'የስሪት ማስታወሻ ያስገቡ (አማራጭ)',versionRemarkMax:'የስሪት ማስታወሻ 200 ቃላት መብለጥ ይሆናል',selectFileLabel:'ፋይም ይምረጡ',selectFilePrompt:'ለመሰቀል ፋይል ይምረጡ',fileInfo:'የፋይል መረጃ',fileInfoName:'ስም: ',fileInfoSize:'መጠን: ',fileInfoType:'ዓይነት: ',fileInfoChunked:'ቆራሽ ሰቀል ይጠቀማል',uploadProgress:'የመሰቀል እቅድ',uploadFileTitle:'ፋይል ስቀል',dragUploadHint:'ለመሰቀል ፋይልን እዚህ ጎትት ወይም ጎትት',singleFileLimit:'በአንድ ጊዜ አንድ ፋይል ብቻ ሊሰቀል ይችላል',filePreviewTitle:'ፋይል ቅድመ-እይታ',selectFilePreview:'ማየት የሚፈልጉትን ፋይል ይምረጡ',formatLabel:'ቅርጸት',previewSupported:'ይደግፋል',previewUnsupported:'አይደግፍም',generatePreview:'ቅድመ-እይታ ፍጠር',previewGenerated:'ቅድመ-እይታ ተፈጥሯል፣ ለማየት አድስ ያድርጉ',close:'ዝጉ',unsupportedFormat:'የዚህ ፋይል ቅርጸት በመስመር ላይ ቅድመ-እይታ አይደግፍም',downloadPrompt:'እባክዎ አውርደው በአካባዊ መተግበሪያ ውስጥ ይክሉ',downloadNow:'አሁን አውርድ',textLoadFailed:'የጽሑፍ ይዘት መጫን አልተሳካም',spaceManagement:'የቦታ አስተዳደር',spaceName:'የቦታ ስም',spaceNamePlaceholder:'የቦታ ስም ያስገቡ',spaceDescription:'የቦታ መግለጫ',spaceDescriptionPlaceholder:'የቦታ መግለጫ ያስገቡ (አማራጭ)',visibilityLabel:'ታይነት',visibilityPlaceholder:'ታይነት ይምረጡ',visibilityPrivate:'ግል',visibilityPublic:'ይፋ',memberCount:'አባላት',nodeCount:'ፋዮች',usedStorage:'ጸዳ ማከማቻ',editSpace:'ቦታ አርትዕ',newSpace:'አዲስ ቦታ',members:'አባላት',archive:'ማህደር',memberHeader:'የቦታ አባላት',userId:'የተጠቃሚ መታወቂያ',userIdPlaceholder:'የተጠቃሚ መታወቂያ ያስገቡ',role:'ሚና',rolePlaceholder:'ሚና',addMember:'ጨምር',addMemberSuccess:'አባል በተሳካ ሁኔታ ተጨምሯል',userIdRequired:'እባክዎ የተጠቃሚ መታወቂያ ያስገቡ',removeMember:'አስወግድ',removeMemberConfirm:'ይህን አባል ማስወገድ ትፈልጋለህ?',removeSuccess:'በተሳካ ሁኔታ ተወግዷል',noMembers:'አባላት የሉም',memberJoinTime:'የቀረበት ቀን',archiveConfirm:'"{name}"ን ማህደር ማድረግ ትፈልጋለህ? ከማህደር በኋላ ቦታ ንባብ ብቻ ይሆናል።',archiveConf:'የማህደር ማረጋገጫ',archiveSuccess:'በተሳካ ሁኔታ ተርጥቷል',deleteSpaceConfirm:'"{name}"ን መሰረዝ ትፈልጋለህ? ይህ ድርጊት መመለስ አይቻልም።',deleteConf:'የመሰረዝ ማረጋገጫ',updateSuccess:'በተሳካ ሁኔታ ተሻሽሏል',confirmToggleVisibility:'ታይነት:',commentManagement:'አስተያየት',commentId:'የአስተያየት መታወቂያ',fileNodeId:'የፋይል ኖድ መታወቂያ',resolved:'ቀረ',unresolved:'አልቀረም',commenter:'አስተያየት ሰጪ',resolveAction:'ፍታ',resolvedSuccess:'እንደ ቀረ ምልክት ተደርጎታል',commentDeleteConf:'ይህን አስተያየት ማጥፋት ትፈልጋለህ?',queryComments:'አስተያየት ጠይቅ',newComment:'አዲስ አስተያየት',fileNodeIdInputPlaceholder:'የፋይል ኖድ መታወቂያ ያስገቡ',fileNodeIdRequired:'በመጀምሪያ የፋይል ኖድ መታወቂያ ያስገቡ',commentFormTitle:'አዲስ አስተያየት',fileNodeIdLabel:'የፋይል ኖድ መታወቂያ',commentContentLabel:'የአስተያየት ይዘት',commentContentPlaceholder:'የአስተያየት ይዘት ያስገቡ',mentionUsers:'ተጠቃሚዎችን አስተያየት',mentionPlaceholder:'ተጠቃሚዎችን ለመፈለግ ይተይቡ (አማራጭ)',quotaManagement:'የማከማቻ ኮታ',scopeType:'የወሰን ዓይነት',scopeTypePlaceholder:'የወሰን ዓይነት (ምሳሌ: USER / SPACE, አማራጭ)',scopeId:'የወሰን መታወቂያ',scopeIdPlaceholder:'የወሰን መታወቂያ (አማራጭ)',queryQuota:'ኮታ ጠይቅ'
